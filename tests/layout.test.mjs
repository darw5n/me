// Unit tests of the pure layout functions. Run with: node --test tests/
// They import the compiled modules, so compile first: npx -y -p typescript tsc
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutMessy, layoutColumn, layoutTidy, tidyGrid, tidyWidth } from "../Script/tavola/layout.js";
import { rotatedBox, overlapsWithGap } from "../Script/tavola/geometry.js";

const item = (id, cluster, rel, size, extra = {}) => ({
  id,
  cluster,
  group: cluster,
  rel,
  size,
  rotation: 0,
  span: 1,
  small: false,
  decoration: false,
  ...extra,
});

// A small table that mirrors the real one: notes, prints, stickers, chalk.
const sample = [
  item("note", "about", { x: 0, y: 0 }, { w: 620, h: 300 }, { rotation: -0.6, span: 2 }),
  item("portrait", "about", { x: 660, y: -10 }, { w: 250, h: 300 }, { rotation: 2.6 }),
  item("now", "about", { x: 950, y: 20 }, { w: 270, h: 200 }, { rotation: -3 }),
  item("chalk-kid", "about", { x: 664, y: 440 }, { w: 540, h: 60 }, { small: true, decoration: true }),
  item("work-1", "work", { x: 0, y: 0 }, { w: 360, h: 300 }, { rotation: -1.6 }),
  item("work-2", "work", { x: 20, y: 40 }, { w: 360, h: 300 }, { rotation: 1.4 }), // deliberately overlapping
  item("folder", "work", { x: 412, y: 360 }, { w: 340, h: 320 }, { rotation: -1.2 }),
  item("path", "path", { x: 0, y: 0 }, { w: 470, h: 260 }, { span: 2 }),
  item("sticker-1", "path", { x: 360, y: -34 }, { w: 110, h: 110 }, { rotation: 7, small: true, group: "pack" }),
  item("sticker-2", "path", { x: 370, y: 190 }, { w: 100, h: 100 }, { rotation: 6, small: true, group: "pack" }),
];

const rectOf = (items, placements, id) => {
  const it = items.find((i) => i.id === id);
  const p = placements.get(id);
  const box = rotatedBox(it.size, p.rotation);
  return { x: p.x + (it.size.w - box.w) / 2, y: p.y + (it.size.h - box.h) / 2, w: box.w, h: box.h };
};

const assertNoOverlaps = (items, placements, gap = 0) => {
  const ids = items.filter((i) => placements.has(i.id)).map((i) => i.id);
  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const a = rectOf(items, placements, ids[i]);
      const b = rectOf(items, placements, ids[j]);
      assert.ok(!overlapsWithGap(a, b, gap), `${ids[i]} overlaps ${ids[j]}`);
    }
  }
};

for (const viewportWidth of [900, 1280, 1440, 1920, 3440]) {
  test(`messy layout at ${viewportWidth} px places every item without overlaps`, () => {
    const result = layoutMessy(sample, { viewportWidth, clusterOrder: ["about", "work", "path"] });
    assert.equal(result.placements.size, sample.length);
    assertNoOverlaps(sample, result.placements);
    assert.ok(result.zoom > 0.6 && result.zoom <= 1, `zoom ${result.zoom}`);
    assert.ok(result.bounds.w > 0 && result.bounds.h > 0);
  });
}

test("messy layout pushes the overlapping prints apart by at least the large gap", () => {
  const { placements } = layoutMessy(sample, { viewportWidth: 1440, clusterOrder: ["about", "work", "path"] });
  const a = rectOf(sample, placements, "work-1");
  const b = rectOf(sample, placements, "work-2");
  assert.ok(!overlapsWithGap(a, b, 33.9));
});

test("messy layout is deterministic", () => {
  const opts = { viewportWidth: 1440, clusterOrder: ["about", "work", "path"] };
  const a = layoutMessy(sample, opts);
  const b = layoutMessy(sample, opts);
  assert.deepEqual([...a.placements], [...b.placements]);
});

for (const viewportWidth of [320, 360, 390, 430, 768]) {
  test(`column layout at ${viewportWidth} px stays inside the screen width`, () => {
    // On a phone the DOM caps every width to the column first; mirror that here.
    const narrowItems = sample.map((i) => ({ ...i, size: { w: Math.min(i.size.w, viewportWidth - 32), h: i.size.h } }));
    const result = layoutColumn(narrowItems, { viewportWidth });
    assert.equal(result.placements.size, sample.length);
    for (const it of narrowItems) {
      const r = rectOf(narrowItems, result.placements, it.id);
      assert.ok(r.x >= 15.9, `${it.id} starts at ${r.x}`);
      assert.ok(r.x + r.w <= viewportWidth - 15.9 + 1.5, `${it.id} ends at ${r.x + r.w} > ${viewportWidth - 16}`);
    }
    assertNoOverlaps(narrowItems, result.placements);
  });
}

test("column layout keeps reading order top to bottom", () => {
  const narrowItems = sample.map((i) => ({ ...i, size: { w: Math.min(i.size.w, 390 - 32), h: i.size.h } }));
  const { placements } = layoutColumn(narrowItems, { viewportWidth: 390 });
  let lastBottom = -Infinity;
  for (const it of narrowItems) {
    const p = placements.get(it.id);
    assert.ok(p.y + it.size.h > lastBottom, `${it.id} is above the previous item`);
    lastBottom = Math.max(lastBottom, p.y);
  }
});

for (const viewportWidth of [390, 1024, 1440, 2560]) {
  test(`tidy layout at ${viewportWidth} px: one label per group, no overlaps, decorations hidden`, () => {
    const grid = tidyGrid(viewportWidth);
    const resized = sample.map((i) => ({ ...i, size: { w: tidyWidth(i, grid, i.size.w), h: i.size.h } }));
    const result = layoutTidy(resized, { viewportWidth, groupOrder: ["about", "work", "path", "pack"] });
    assert.deepEqual([...result.labels.keys()], ["about", "work", "path", "pack"]);
    assert.ok(!result.placements.has("chalk-kid"), "decorations are not placed");
    assert.equal(result.placements.size, sample.length - 1);
    for (const p of result.placements.values()) assert.equal(p.rotation, 0);
    assertNoOverlaps(resized, result.placements);
    for (const it of resized) {
      const p = result.placements.get(it.id);
      if (p) assert.ok(p.x + it.size.w <= grid.x0 + grid.width + 0.5, `${it.id} exceeds the grid`);
    }
  });
}

test("tidy grid is a single column on phones and 3 to 8 columns elsewhere", () => {
  assert.equal(tidyGrid(390).columns, 1);
  assert.equal(tidyGrid(1000).columns, 3);
  assert.ok(tidyGrid(3440).columns <= 8);
});
