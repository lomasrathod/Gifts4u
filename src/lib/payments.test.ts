import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhook } from "./payments";

const secret = "whsec_" + Buffer.from("test-secret-key").toString("base64");

function sign(body: string, ts = Math.floor(Date.now() / 1000)) {
  const sig = createHmac("sha256", Buffer.from("test-secret-key")).update(`msg_1.${ts}.${body}`).digest("base64");
  return new Headers({ "webhook-id": "msg_1", "webhook-timestamp": String(ts), "webhook-signature": `v1,${sig}` });
}

describe("verifyWebhook", () => {
  it("accepts a valid signature", () => {
    expect(verifyWebhook('{"a":1}', sign('{"a":1}'), secret)).toBe(true);
  });
  it("rejects a tampered body", () => {
    expect(verifyWebhook('{"a":2}', sign('{"a":1}'), secret)).toBe(false);
  });
  it("rejects old timestamps", () => {
    expect(verifyWebhook("{}", sign("{}", 1_000_000), secret)).toBe(false);
  });
});
