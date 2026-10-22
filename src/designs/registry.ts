import type { DesignMeta, Occasion } from "./types";

const names = [
  { key: "theirName", label: "Their first name", kind: "text", max: 24, placeholder: "Maya" },
  { key: "yourName", label: "Your first name", kind: "text", max: 24, placeholder: "Sam" },
] as const;

export const designs: DesignMeta[] = [
  {
    id: "sunset-island",
    name: "Sunset Island",
    kind: "world",
    tagline: "A 3D island you walk together, from anywhere.",
    description:
      "Open the same link on two phones or laptops and you are both on a warm island at sunset. Find the bottle with your letter, read your photos on the pier, and wait for the plane that tows your question across the sky.",
    occasions: ["love", "proposal", "anniversary", "long-distance"],
    usdCents: 3999,
    players: 4,
    minutes: "15 to 40 min",
    photos: { max: 3, label: "Up to 3 photos, shown on the pier" },
    question: { field: "question", yes: "Yes!", no: "Let me think" },
    fields: [
      ...names,
      { key: "welcome", label: "Welcome line on arrival", kind: "text", max: 80, placeholder: "Welcome to our island", ai: true },
      { key: "letter", label: "Letter in the bottle", kind: "textarea", max: 900, help: "Two to four short paragraphs. End on a hint that a question is coming.", ai: true },
      { key: "question", label: "Question the plane carries", kind: "text", max: 48, placeholder: "Will you move in with me?", ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, placeholder: "Best answer ever. Pack your bags.", ai: true },
      { key: "signoff", label: "Sign-off", kind: "text", max: 40, placeholder: "Always yours", ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        welcome: "Welcome to our island, Maya",
        letter:
          "Three years ago you laughed at my terrible map reading and we got lost for six hours.\n\nI have never been happier to be lost. Every place is better with you in it, even a bus stop in the rain.\n\nSo I built us a place that is only ours. Look up when you are ready.",
        question: "Will you move in with me?",
        afterYes: "Best answer ever. I'm already packing.",
        signoff: "Always yours, Sam",
      },
      photos: [],
    },
    palette: { from: "#ff9a62", to: "#7a4bd8", ink: "#2a1240" },
  },
  {
    id: "our-museum",
    name: "Our Museum",
    kind: "world",
    tagline: "A private 3D gallery of your story, walked together.",
    description:
      "A warm museum hall with your photos in gold frames and your captions on little plaques. You can both walk it from anywhere on the same link. A letter waits on a pedestal, and the last painting is hidden under a red curtain until the moment is right.",
    occasions: ["anniversary", "love", "proposal", "long-distance", "birthday"],
    usdCents: 2999,
    players: 4,
    minutes: "10 to 30 min",
    photos: { max: 6, label: "Up to 6 photos, hung in gold frames" },
    question: { field: "question", yes: "Yes!", no: "Let me think" },
    fields: [
      ...names,
      { key: "title", label: "Name of your museum", kind: "text", max: 32, placeholder: "The Museum of Us", ai: true },
      { key: "welcome", label: "Welcome line at the door", kind: "text", max: 80, placeholder: "Welcome to the Museum of Us, Maya", ai: true },
      { key: "captions", label: "Captions under the photos", kind: "textarea", max: 600, optional: true, help: "One line per photo, in the same order. Keep each one short.", placeholder: "Our first trip, Lisbon\nThe night of the terrible karaoke" },
      { key: "letter", label: "Letter on the pedestal", kind: "textarea", max: 900, help: "Two to four short paragraphs. End on a hint that the last piece is waiting.", ai: true },
      { key: "question", label: "The final piece (your question)", kind: "text", max: 60, placeholder: "Will you marry me?", ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, ai: true },
      { key: "signoff", label: "Sign-off", kind: "text", max: 40, placeholder: "Always yours, Sam", ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        title: "The Museum of Us",
        welcome: "Welcome to the Museum of Us, Maya",
        captions:
          "The bus stop in the rain, where it started\nOur first trip. The lighthouse hotel.\nYour grandmother's soup, attempt no. 4\nSunday mornings, permanent collection\nThe day we got the keys\nEverything after this is still being painted",
        letter:
          "Every museum keeps the things that matter most. I wanted one for us.\n\nWalk slowly. Every frame here is a day I would live again, even the soup that went wrong.\n\nThere is one more piece at the end of the hall. I have been working on it for a long time.",
        question: "Will you marry me?",
        afterYes: "Then this museum just got its best piece. I love you.",
        signoff: "Always yours, Sam",
      },
      photos: [],
    },
    palette: { from: "#3b2418", to: "#a3233f", ink: "#fbf6ec" },
  },
  {
    id: "paris-together",
    name: "Paris Together",
    kind: "page",
    tagline: "A night in Paris, a letter, and a boarding pass if they say oui.",
    description:
      "The Eiffel Tower sparkles over the river at night. They open your sealed letter, walk past your photos, then get your question. Say yes and a boarding pass appears with their name on it.",
    occasions: ["love", "proposal", "anniversary", "long-distance"],
    usdCents: 1499,
    minutes: "3 to 5 min",
    photos: { max: 4, label: "Up to 4 photos, pinned like polaroids" },
    question: { field: "question", yes: "Oui !", no: "Let me think" },
    fields: [
      ...names,
      { key: "letter", label: "Your letter", kind: "textarea", max: 800, ai: true, help: "Two or three short paragraphs." },
      { key: "captions", label: "Captions under the photos", kind: "textarea", max: 300, optional: true, help: "One short line per photo, in order." },
      { key: "question", label: "Your question", kind: "text", max: 60, placeholder: "Will you come to Paris with me?", ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, ai: true },
      { key: "tripFrom", label: "Boarding pass: flying from", kind: "text", max: 24, optional: true, placeholder: "Mumbai", help: "Shown on the boarding pass after yes." },
      { key: "tripWhen", label: "Boarding pass: date", kind: "text", max: 24, optional: true, placeholder: "Spring 2027", help: "A real date, or something like 'someday soon'." },
      { key: "signoff", label: "Sign-off", kind: "text", max: 40, placeholder: "Je t'aime, Sam", ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        letter:
          "You always said Paris was the one place you'd never been and always wanted to see.\n\nI can't stop thinking about you saying that, half asleep on the sofa, like it was a secret.\n\nSo here is the city, at least for tonight. And here is a question I have been holding onto.",
        captions: "Our first coffee\nThe very long walk home\nYou, pretending to be French",
        question: "Will you come to Paris with me?",
        afterYes: "I already know which bakery we're going to first.",
        tripFrom: "London",
        tripWhen: "14 Feb 2027",
        signoff: "Je t'aime, Sam",
      },
      photos: [],
    },
    palette: { from: "#0b1036", to: "#b4607f", ink: "#fdf3e3" },
  },
  {
    id: "sakura-night",
    name: "Sakura Night",
    kind: "page",
    tagline: "Anime night sky, falling petals, your words one line at a time.",
    description:
      "A moonlit garden with cherry blossoms drifting down. Your message appears one line at a time as they tap, like the last scene of a film. It ends with your question under the moon.",
    occasions: ["love", "proposal", "apology", "anniversary", "friends"],
    usdCents: 1299,
    minutes: "2 to 4 min",
    photos: { max: 3, label: "Up to 3 photos, shown as moons (optional)" },
    question: { field: "question", yes: "Yes", no: "Read it again" },
    fields: [
      ...names,
      { key: "lines", label: "Your message, one line at a time", kind: "textarea", max: 700, ai: true, help: "Each line appears on its own as they tap. Five to ten short lines work best." },
      { key: "question", label: "Your question", kind: "text", max: 60, placeholder: "Will you stay with me?", ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, ai: true },
      { key: "signoff", label: "Sign-off", kind: "text", max: 40, placeholder: "Sam", ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        lines:
          "I'm not good at saying things out loud.\nSo I waited for the blossoms.\nThey only last a week every year.\nI used to think that was sad.\nNow I think it means you pay attention.\nI want to pay attention to you.\nEvery spring. Every ordinary night.",
        question: "Will you stay with me?",
        afterYes: "Then let's find a real cherry tree this spring. I'll bring the snacks.",
        signoff: "Sam",
      },
      photos: [],
    },
    palette: { from: "#140f33", to: "#ff9ec0", ink: "#fdeef4" },
  },
  {
    id: "kitty-letter",
    name: "Kitty Letter",
    kind: "page",
    tagline: "A tiny kitten carries in your letter, then asks your question.",
    description:
      "A kitten walks in holding an envelope. It opens to your letter, then asks your question. Every “no” makes the kitten a little sadder and the no button a little smaller.",
    occasions: ["love", "proposal", "apology", "friends"],
    usdCents: 999,
    minutes: "2 to 4 min",
    photos: { max: 1, label: "One photo, shown inside the letter (optional)" },
    question: { field: "question", yes: "Yes", no: "No" },
    fields: [
      ...names,
      { key: "letterTitle", label: "Letter title", kind: "text", max: 48, placeholder: "A small note for you", ai: true },
      { key: "letter", label: "Your letter", kind: "textarea", max: 700, ai: true },
      { key: "question", label: "Your question", kind: "text", max: 60, placeholder: "Will you be my valentine?", ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, ai: true },
      { key: "signoff", label: "Sign-off", kind: "text", max: 40, placeholder: "Love, Sam", ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        letterTitle: "A small note for you",
        letter:
          "You make ordinary Tuesdays feel like holidays. You steal my fries and my hoodies and somehow I keep thanking you for it.\n\nI wanted to ask you something properly, so I hired a professional.",
        question: "Will you be my valentine?",
        afterYes: "The kitten and I are very relieved. Dinner on Friday, I'm booking it now.",
        signoff: "Love, Sam",
      },
      photos: [],
    },
    palette: { from: "#ffd6e0", to: "#ffb3c7", ink: "#5a1830" },
  },
  {
    id: "our-universe",
    name: "Our Universe",
    kind: "page",
    tagline: "Scroll from the first day you met to the edge of the universe.",
    description:
      "A slow scroll through a starry sky. Each star is a moment you choose, with a photo and a line. It ends at the edge of the universe with your question.",
    occasions: ["love", "anniversary", "long-distance", "proposal"],
    usdCents: 1499,
    minutes: "3 to 6 min",
    photos: { max: 4, label: "Up to 4 photos, one per moment" },
    question: { field: "question", yes: "Yes, always", no: "Ask me again" },
    fields: [
      ...names,
      { key: "opening", label: "Opening line", kind: "text", max: 100, placeholder: "Every universe starts somewhere. Ours started on a Tuesday.", ai: true },
      { key: "moment1", label: "Moment 1", kind: "text", max: 160, ai: true },
      { key: "moment2", label: "Moment 2", kind: "text", max: 160, ai: true },
      { key: "moment3", label: "Moment 3", kind: "text", max: 160, ai: true },
      { key: "moment4", label: "Moment 4", kind: "text", max: 160, ai: true, optional: true },
      { key: "question", label: "Question at the edge of the universe", kind: "text", max: 60, ai: true },
      { key: "afterYes", label: "What they see after yes", kind: "text", max: 140, ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        opening: "Every universe starts somewhere. Ours started at a bus stop in the rain.",
        moment1: "The night you shared your umbrella and walked the wrong way just to keep talking.",
        moment2: "Our first trip, when the hotel lost our booking and we slept in a lighthouse.",
        moment3: "Learning to cook your grandmother's soup over a very bad video call.",
        moment4: "Every ordinary morning since. Those are my favourite.",
        question: "Will you keep exploring with me?",
        afterYes: "Then the universe just got a little bigger. I love you.",
      },
      photos: [],
    },
    palette: { from: "#0b1030", to: "#3b1d6e", ink: "#f4ecff" },
  },
  {
    id: "memory-wall",
    name: "Memory Wall",
    kind: "page",
    tagline: "A wall of polaroids and notes to flip, for birthdays and friends.",
    description:
      "Polaroids pinned to a cork wall. Each one flips to show a note. At the end they can write a reply that comes straight back to you.",
    occasions: ["birthday", "friends", "graduation", "anniversary"],
    usdCents: 1299,
    minutes: "3 to 5 min",
    photos: { max: 6, label: "Up to 6 photos, one per polaroid" },
    fields: [
      ...names,
      { key: "headline", label: "Headline", kind: "text", max: 60, placeholder: "Happy 30th, Maya!", ai: true },
      { key: "note1", label: "Note 1", kind: "text", max: 120, ai: true },
      { key: "note2", label: "Note 2", kind: "text", max: 120, ai: true },
      { key: "note3", label: "Note 3", kind: "text", max: 120, ai: true },
      { key: "note4", label: "Note 4", kind: "text", max: 120, ai: true, optional: true },
      { key: "note5", label: "Note 5", kind: "text", max: 120, ai: true, optional: true },
      { key: "note6", label: "Note 6", kind: "text", max: 120, ai: true, optional: true },
      { key: "closing", label: "Closing message", kind: "textarea", max: 300, ai: true },
    ],
    demo: {
      fields: {
        theirName: "Maya",
        yourName: "Sam",
        headline: "Happy 30th, Maya!",
        note1: "The camping trip where you fought a goose and won.",
        note2: "You drove four hours to bring me soup. Legend.",
        note3: "Karaoke night. We do not talk about karaoke night.",
        note4: "First day at the new flat, eating pizza on the floor.",
        note5: "Graduation! You cried, I cried, the dean cried.",
        note6: "To many more years of terrible ideas together.",
        closing: "Thirty looks good on you. Thank you for being the friend who always shows up. Drinks are on me this weekend.",
      },
      photos: [],
    },
    palette: { from: "#f5e6c8", to: "#d9b98a", ink: "#3b2a16" },
  },
];

export const occasionLabels: Record<Occasion, string> = {
  love: "Love",
  proposal: "A big question",
  anniversary: "Anniversary",
  "long-distance": "Long distance",
  birthday: "Birthday",
  friends: "Friends",
  graduation: "Graduation",
  apology: "Saying sorry",
};

export function getDesign(id: string): DesignMeta | undefined {
  return designs.find((d) => d.id === id);
}

/** Keeps only known fields, trims them to their limits, and caps photos. */
export function sanitizeContent(design: DesignMeta, input: { fields?: Record<string, unknown>; photos?: unknown[] }) {
  const fields: Record<string, string> = {};
  for (const f of design.fields) {
    const v = input.fields?.[f.key];
    fields[f.key] = typeof v === "string" ? v.slice(0, f.max) : "";
  }
  const photos = (input.photos ?? [])
    .filter((p): p is string => typeof p === "string" && /^[a-z0-9]{16,32}\.(jpg|png|webp|gif)$/.test(p))
    .slice(0, design.photos.max);
  return { fields, photos };
}

export function missingFields(design: DesignMeta, fields: Record<string, string>): string[] {
  return design.fields.filter((f) => !f.optional && !fields[f.key]?.trim()).map((f) => f.label);
}
