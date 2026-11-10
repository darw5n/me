// The email written for "Ask for the portfolio" (request.ts). Compile first.
import { test } from "node:test";
import assert from "node:assert/strict";
import { subjectOf, bodyOf } from "../Script/tavola/request.js";

test("subject names the person and, if given, the company", () => {
  assert.equal(subjectOf({ name: "Anna", company: "Acme", message: "" }), "Portfolio access: Anna, Acme");
  assert.equal(subjectOf({ name: "Anna", company: "", message: "" }), "Portfolio access: Anna");
});

test("body asks for the link and carries the message only when there is one", () => {
  const withMessage = bodyOf({ name: "Anna", company: "Acme", message: "We met at the meetup." });
  assert.match(withMessage, /^Hi Darwin,\n\nI'm Anna from Acme\. Could you send me the link to your portfolio\?\n\nWe met at the meetup\.\n\nThanks!$/);
  const bare = bodyOf({ name: "Anna", company: "", message: "" });
  assert.equal(bare, "Hi Darwin,\n\nI'm Anna. Could you send me the link to your portfolio?\n\nThanks!");
});

test("the encoded address decodes, and bad codes give nothing", async () => {
  globalThis.atob ??= (s) => Buffer.from(s, "base64").toString("binary");
  const { decodeMail } = await import("../Script/tavola/mail.js");
  // Only the shape is checked here: the address itself must never be written in the repo.
  assert.match(decodeMail("bW9jLmxpYW1nQHJlaGdldi5uaXdyYWQ=") ?? "", /^[^@\s]+@[^@\s]+\.[a-z]+$/);
  assert.equal(decodeMail("not base64!"), null);
  assert.equal(decodeMail(undefined), null);
});
