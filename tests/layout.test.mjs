// Unit tests of the pure layout functions. Run with: node --test tests/
// They import the compiled modules, so compile first: npx -y -p typescript tsc
import { test } from "node:test";
import assert from "node:assert/strict";
import { layoutMessy, layoutColumn, layoutComposed, layoutPhoneGrid, layoutTidy, phoneTable, tidyGrid, tidyWidth } from "../Script/tavola/layout.js";
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

// A bigger table, a dozen clusters of different shapes, like the real one
const clusterOf = (key, w, h) => [
  item(`${key}-a`, key, { x: 0, y: 0 }, { w: Math.round(w * 0.55), h }, { rotation: -1 }),
  item(`${key}-b`, key, { x: Math.round(w * 0.6), y: 10 }, { w: Math.round(w * 0.4), h: Math.round(h * 0.7) }, { rotation: 2 }),
];
const shapes = [["c0", 1360, 520], ["c1", 760, 600], ["c2", 600, 330], ["c3", 1070, 700], ["c4", 880, 500], ["c5", 760, 410],
  ["c6", 560, 520], ["c7", 790, 640], ["c8", 1070, 350], ["c9", 860, 600], ["c10", 900, 250], ["c11", 680, 450]];
const big = shapes.flatMap(([k, w, h]) => clusterOf(k, w, h));
const bigOrder = shapes.map(([k]) => k);
const clusterBox = (placements, key) => {
  const rs = big.filter((i) => i.cluster === key).map((i) => rectOf(big, placements, i.id));
  const x = Math.min(...rs.map((r) => r.x)), y = Math.min(...rs.map((r) => r.y));
  return { x, y, w: Math.max(...rs.map((r) => r.x + r.w)) - x, h: Math.max(...rs.map((r) => r.y + r.h)) - y };
};

for (const [w, h] of [[720, 1024], [1024, 768], [1280, 720], [1440, 900], [1920, 1080], [2560, 1440], [3440, 1440]]) {
  test(`messy table at ${w}x${h}: no overlaps, first cluster top left, a shape close to the screen`, () => {
    const r = layoutMessy(big, { viewportWidth: w, viewportHeight: h, clusterOrder: bigOrder });
    assertNoOverlaps(big, r.placements);
    const first = clusterBox(r.placements, "c0");
    for (const key of bigOrder.slice(1)) {
      const c = clusterBox(r.placements, key);
      assert.ok(c.y >= first.y - 1 || c.x >= first.x + first.w, `${key} sits above or left of the first cluster`);
    }
    const ratio = r.bounds.w / r.bounds.h;
    const screen = w / h;
    assert.ok(ratio > screen * 0.6 && ratio < screen * 2, `table ${ratio.toFixed(2)} vs screen ${screen.toFixed(2)}`);
  });
}

// Nine areas from the twelve clusters, as on /me
const areas = [["c0"], ["c1", "c2"], ["c3"], ["c4"], ["c5", "c6"], ["c7"], ["c8"], ["c9", "c10"], ["c11"]];
for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [3440, 1440]]) {
  test(`areas at ${w}x${h}: a 3x3 grid, read row by row, no overlaps`, () => {
    const r = layoutMessy(big, { viewportWidth: w, viewportHeight: h, clusterOrder: bigOrder, zones: areas });
    assertNoOverlaps(big, r.placements);
    const firstOf = areas.map((a) => clusterBox(r.placements, a[0]));
    for (let row = 0; row < 3; row++) {
      const [a, b, c] = firstOf.slice(row * 3, row * 3 + 3);
      assert.ok(a.x < b.x && b.x < c.x, `row ${row} reads left to right`);
      if (row > 0) {
        const above = firstOf.slice((row - 1) * 3, row * 3);
        assert.ok(Math.min(a.y, b.y, c.y) > Math.min(...above.map((p) => p.y)), `row ${row} sits below row ${row - 1}`);
      }
    }
    // Areas are set apart: the gap between columns is much wider than inside an area
    assert.ok(firstOf[1].x - (firstOf[0].x + firstOf[0].w) >= 300, "columns of areas are well apart");
  });
}

test("messy table: a few pixels wider keeps every cluster where it was", () => {
  const a = layoutMessy(big, { viewportWidth: 1440, viewportHeight: 900, clusterOrder: bigOrder });
  const b = layoutMessy(big, { viewportWidth: 1450, viewportHeight: 900, clusterOrder: bigOrder });
  for (const key of bigOrder) {
    const p = clusterBox(a.placements, key), q = clusterBox(b.placements, key);
    assert.ok(Math.abs(p.x - q.x) < 40 && Math.abs(p.y - q.y) < 40, `${key} moved`);
  }
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

test("column layout never pushes a small object out of the screen", () => {
  // Two stickers that share a row, then a tall one that collides with both:
  // a sideways push would take it past the right edge.
  const crowd = [
    item("a", "x", { x: 0, y: 0 }, { w: 150, h: 60 }, { small: true }),
    item("b", "x", { x: 0, y: 0 }, { w: 150, h: 200 }, { small: true }),
    item("c", "x", { x: 0, y: 0 }, { w: 160, h: 120 }, { small: true, rotation: 8 }),
    item("d", "x", { x: 0, y: 0 }, { w: 208, h: 90 }, { rotation: -3 }),
  ];
  const { placements } = layoutColumn(crowd, { viewportWidth: 320 });
  for (const it of crowd) {
    const r = rectOf(crowd, placements, it.id);
    assert.ok(r.x + r.w <= 320 - 16 + 1.5, `${it.id} ends at ${Math.round(r.x + r.w)}`);
  }
  assertNoOverlaps(crowd, placements);
});

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

test("tidy grid is two columns on phones and 3 to 8 columns elsewhere", () => {
  assert.equal(tidyGrid(390).columns, 2);
  assert.equal(tidyGrid(1000).columns, 3);
  assert.ok(tidyGrid(3440).columns <= 8);
});

// Phone, messy: the composition laid out by hand on a 390 px screen.
const composed = sample.map((it, i) => ({ ...it, phoneAt: { x: (i % 3) * 120 - 100, y: 72 + i * 140 } }));

test("composed layout reproduces the hand-made positions on a 390 px screen", () => {
  const { side } = phoneTable(390);
  const { placements } = layoutComposed(composed, { viewportWidth: 390, side });
  for (const it of composed) {
    const p = placements.get(it.id);
    assert.equal(p.x, side + it.phoneAt.x);
    assert.equal(p.y, it.phoneAt.y);
  }
});

test("composed layout scales the whole composition on other screens and stays on the table", () => {
  for (const vw of [320, 430]) {
    const table = phoneTable(vw);
    const k = vw / 390;
    const { placements } = layoutComposed(composed, { viewportWidth: vw, side: table.side });
    for (const it of composed) {
      const p = placements.get(it.id);
      assert.ok(Math.abs(p.y - it.phoneAt.y * k) < 0.01, `${it.id} is not scaled`);
      assert.ok(p.x >= 0 && p.x + it.size.w <= table.width, `${it.id} leaves the table`);
    }
  }
});

test("composed layout puts objects without a position in a column below the rest", () => {
  const items = [...composed, item("new", "about", { x: 0, y: 0 }, { w: 200, h: 100 })];
  const { side } = phoneTable(390);
  const { placements } = layoutComposed(items, { viewportWidth: 390, side });
  const lowest = Math.max(...composed.map((it) => placements.get(it.id).y + it.size.h));
  assert.ok(placements.get("new").y > lowest, "the loose object is not below the composition");
});

test("phone column: a new group starts further down than the next row of the same group", () => {
  const items = [
    item("a", "one", { x: 0, y: 0 }, { w: 300, h: 100 }),
    item("b", "one", { x: 0, y: 0 }, { w: 300, h: 100 }),
    item("c", "two", { x: 0, y: 0 }, { w: 300, h: 100 }),
  ];
  const { placements } = layoutColumn(items, { viewportWidth: 390, padding: 20, top: 0 });
  const rowGap = placements.get("b").y - (placements.get("a").y + 100);
  const sectionGap = placements.get("c").y - (placements.get("b").y + 100);
  assert.ok(sectionGap >= rowGap * 2, `section gap ${sectionGap} is not at least twice the row gap ${rowGap}`);
});

test("phone grid: the middle column holds its areas in order, sides sit level with their row, nothing overlaps", () => {
  const phone = [
    item("hello", "about", { x: 0, y: 0 }, { w: 350, h: 260 }),
    item("folder", "work", { x: 0, y: 0 }, { w: 340, h: 300 }),
    item("sheet-1", "work", { x: 0, y: 0 }, { w: 340, h: 280 }, { phoneArea: "projects" }),
    item("sheet-2", "work", { x: 0, y: 0 }, { w: 340, h: 280 }, { phoneArea: "projects" }),
    item("quote", "path", { x: 0, y: 0 }, { w: 330, h: 180 }, { phoneArea: "quotes" }),
    item("ask", "ask", { x: 0, y: 0 }, { w: 300, h: 300 }),
    item("stray", "elsewhere", { x: 0, y: 0 }, { w: 200, h: 100 }),
  ];
  const vw = 390, side = 1170;
  const rows = [{ center: ["about"] }, { left: ["projects"], center: ["work"], right: ["quotes"] }, { center: ["ask"] }];
  const r = layoutPhoneGrid(phone, { viewportWidth: vw, side, rows, padding: 20 });
  assert.equal(r.placements.size, phone.length);
  assertNoOverlaps(phone, r.placements);
  const at = (id) => r.placements.get(id);
  // Middle column: about, then work, then ask, inside the opening screen
  for (const id of ["hello", "folder", "ask", "stray"]) assert.ok(at(id).x >= side && at(id).x + 350 <= side + vw + 1, id);
  assert.ok(at("hello").y < at("folder").y && at("folder").y < at("ask").y);
  // The middle runs on: ask comes right after the folder, not after the two long project sheets
  assert.ok(at("ask").y < at("sheet-2").y + 280, "the middle column does not wait for the side to end");
  // Sides: one screen left and right, level with the folder
  assert.ok(at("sheet-1").x < side && at("quote").x >= side + vw);
  assert.equal(Math.round(at("sheet-1").y), Math.round(at("folder").y));
  assert.equal(Math.round(at("quote").y), Math.round(at("folder").y));
});
