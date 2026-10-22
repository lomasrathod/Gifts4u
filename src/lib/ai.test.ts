import { describe, expect, it } from "vitest";
import { designs } from "@/designs/registry";
import { interviewSchema, templateFill } from "./ai";

describe("templateFill", () => {
  it("fills every AI field of every design within limits", () => {
    const interview = interviewSchema.parse({ theirName: "Maya", yourName: "Sam", insideJoke: "the goose incident" });
    for (const d of designs) {
      const out = templateFill(d, interview);
      for (const f of d.fields.filter((f) => f.ai && !f.optional)) {
        expect(out[f.key], `${d.id}.${f.key}`).toBeTruthy();
        expect(out[f.key]!.length).toBeLessThanOrEqual(f.max);
      }
    }
  });
});
