#!/usr/bin/env node
// Writes into the page the positions copied with the composition tool (open the page with ?edit,
// drag objects, press "Copy positions"; see src/tavola/compose.ts):
//
//   pbpaste | node scripts/apply-positions.mjs          or   node scripts/apply-positions.mjs copied.json
//
// Each change names the N-th `.item` of the page (DOM order is source order), an attribute and its
// value when it was copied. If the page changed meanwhile and a value no longer matches, nothing is
// written. No dependencies: plain Node.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const fail = (message) => {
  console.error(message);
  process.exit(1);
};

let data;
try {
  data = JSON.parse(readFileSync(process.argv[2] ?? 0, "utf8"));
} catch {
  fail("Not the JSON copied with \"Copy positions\" (open the page with ?edit).");
}
if (data.tool !== "tavola-positions" || !Array.isArray(data.changes)) fail("Not the JSON copied with \"Copy positions\".");
if (!/^[\w./-]+\.html$/.test(data.page) || data.page.includes("..")) fail(`Unexpected page: ${data.page}`);

const file = fileURLToPath(new URL(`../${data.page}`, import.meta.url));
const html = readFileSync(file, "utf8");
// Opening tags whose class list has the token "item" (not item__body, not items)
const tags = [...html.matchAll(/<[a-z]+\s[^>]*?\bclass="(?:[^"]*\s)?item(?:\s[^"]*)?"[^>]*>/g)];
if (typeof data.items === "number" && tags.length !== data.items) {
  fail(`${data.page} has ${tags.length} objects, the page had ${data.items} when copied: reload it and copy again.`);
}

const same = (a, b) => a.replace(/\s/g, "") === b.replace(/\s/g, "");
const problems = [];
const edits = data.changes.map((c) => {
  const tag = tags[c.index];
  if (!tag) return problems.push(`object ${c.index + 1} (#${c.id}) not found`), null;
  const attr = new RegExp(`\\s${c.attr}="([^"]*)"`);
  const current = tag[0].match(attr);
  if (!same(current ? current[1] : "0,0", c.from)) {
    return problems.push(`#${c.id}: ${c.attr} is "${current?.[1] ?? "(none)"}" in the page, "${c.from}" when copied`), null;
  }
  const next = current
    ? tag[0].replace(attr, ` ${c.attr}="${c.to}"`)
    : tag[0].replace(/(\bclass="[^"]*")/, `$1 ${c.attr}="${c.to}"`);
  return { start: tag.index, end: tag.index + tag[0].length, next, c };
});
if (problems.length) fail(`Nothing written: the page changed since the copy.\n- ${problems.join("\n- ")}`);

let out = html;
for (const e of [...edits].sort((a, b) => b.start - a.start)) out = out.slice(0, e.start) + e.next + out.slice(e.end);
writeFileSync(file, out);

for (const { c } of edits) {
  console.log(`#${c.id}: ${c.attr} ${c.from} → ${c.to}${c.near ? `   (touches #${c.near}: relax will push them apart, unless one is data-on-top)` : ""}`);
}
console.log(`${edits.length} written in ${data.page}.`);
