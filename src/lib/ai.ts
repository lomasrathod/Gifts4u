import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import type { DesignMeta } from "@/designs/types";
import { env } from "@/lib/env";

export const interviewSchema = z.object({
  theirName: z.string().trim().min(1).max(24),
  yourName: z.string().trim().min(1).max(24),
  relationship: z.string().trim().max(80).default(""),
  story: z.string().trim().max(600).default(""),
  insideJoke: z.string().trim().max(200).default(""),
  question: z.string().trim().max(80).default(""),
  tone: z.enum(["romantic", "sweet", "funny", "poetic"]).default("sweet"),
});
export type Interview = z.infer<typeof interviewSchema>;

const client = env.anthropicApiKey ? new Anthropic({ apiKey: env.anthropicApiKey }) : null;

/**
 * Turns a short interview into every text field of a design.
 * The buyer always reviews the result before paying.
 */
export async function writeGift(design: DesignMeta, interview: Interview): Promise<Record<string, string>> {
  const aiFields = design.fields.filter((f) => f.ai);
  if (!client) return templateFill(design, interview);

  const schema = z.object(Object.fromEntries(aiFields.map((f) => [f.key, z.string()])));
  const fieldGuide = aiFields
    .map((f) => `- ${f.key} (${f.label}; at most ${f.max} characters${f.help ? `; ${f.help}` : ""})`)
    .join("\n");

  const response = await client.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 4000,
    output_config: { effort: "low", format: zodOutputFormat(schema) },
    system:
      "You write the words for a personal digital gift. Write like a real person talking to someone they love: specific, warm, plain words, short sentences. Use the details the buyer gave; never invent big facts like dates, places or events they did not mention. No clichés like 'soulmate' or 'you complete me'. No emojis unless the tone is funny. Respect every character limit.",
    messages: [
      {
        role: "user",
        content: `Design: ${design.name}. ${design.description}

From: ${interview.yourName}
To: ${interview.theirName}
Relationship: ${interview.relationship || "not given"}
Tone: ${interview.tone}
Their story, in the buyer's words: ${interview.story || "not given"}
Inside joke or small detail: ${interview.insideJoke || "not given"}
${interview.question ? `The question they want to ask: ${interview.question}` : ""}

Fill these fields:
${fieldGuide}`,
      },
    ],
  });

  if (response.stop_reason === "refusal" || !response.parsed_output) return templateFill(design, interview);
  const out: Record<string, string> = {};
  for (const f of aiFields) out[f.key] = String(response.parsed_output[f.key] ?? "").slice(0, f.max);
  return out;
}

/** Deterministic fallback so the writer works without an API key. */
export function templateFill(design: DesignMeta, i: Interview): Record<string, string> {
  const them = i.theirName;
  const me = i.yourName;
  const detail = i.insideJoke || i.story.split(/[.!?]/)[0] || "every small moment with you";
  const q = i.question || (design.question ? "Will you be mine, again and again?" : "");
  const pool: Record<string, string> = {
    welcome: design.id === "our-museum" ? `Welcome to the Museum of Us, ${them}` : `Welcome to our island, ${them}`,
    title: "The Museum of Us",
    lines: [
      `${them}, I'm not always good with words.`,
      i.insideJoke ? `But I still smile about ${detail}.` : `But I remember ${detail.toLowerCase()}.`,
      "The small moments are the ones I keep.",
      "You make ordinary nights feel like this one.",
      "So I want to ask you something.",
    ].join("\n"),
    letterTitle: `A small note for ${them}`,
    letter: `${them},\n\nI keep thinking about the little things, like ${i.insideJoke ? `how ${detail}` : detail.toLowerCase()}. Those are the things I will remember when I am old.\n\nYou make ordinary days feel like something worth keeping. So I made you something to keep.\n\nThere is one more thing I want to ask you.`,
    question: q,
    afterYes: `That is the best answer I could get. I love you, ${them}.`,
    signoff: `Always, ${me}`,
    opening: `Every universe starts somewhere. Ours started with ${me} and ${them}.`,
    moment1: `The first time we met, and I could not stop smiling.`,
    moment2: detail.charAt(0).toUpperCase() + detail.slice(1) + ".",
    moment3: `All the late talks and the even later goodnights.`,
    moment4: `Every ordinary morning since. Those are my favourite.`,
    headline: `For you, ${them}!`,
    note1: `The day we met. Look at us.`,
    note2: detail.charAt(0).toUpperCase() + detail.slice(1) + ".",
    note3: `You, always making everything more fun.`,
    note4: `The time we laughed until we cried.`,
    note5: `Proof that we are great together.`,
    note6: `To many more years of this.`,
    closing: `Thank you for being you, ${them}. Here is to many more memories together. Love, ${me}.`,
  };
  const out: Record<string, string> = {};
  for (const f of design.fields.filter((f) => f.ai)) out[f.key] = (pool[f.key] ?? "").slice(0, f.max);
  return out;
}
