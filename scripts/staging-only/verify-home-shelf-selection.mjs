import assert from "node:assert/strict";
import {
  softAdjustNewestChronology,
  softSuppressByCategory,
  softSuppressCrossShelfProject,
  selectUsagePairs,
} from "../../lib/player-ia/home-shelf-selection.ts";

const ranked = [
  { projectId: "1", category: "game" },
  { projectId: "2", category: "game" },
  { projectId: "3", category: "audio" },
  { projectId: "4", category: "asset" },
  { projectId: "5", category: "game" },
];

const suppressed = softSuppressByCategory(ranked, 4);
assert.equal(suppressed.length, 4);
assert.equal(suppressed[0].projectId, "1");
assert.ok(suppressed.some((x) => x.category === "audio"));

const newestAllGame = [
  { projectId: "a", category: "game" },
  { projectId: "b", category: "game" },
  { projectId: "c", category: "game" },
  { projectId: "d", category: "game" },
  { projectId: "e", category: "audio" },
];
const adjusted = softAdjustNewestChronology(newestAllGame, 4);
assert.equal(adjusted.length, 4);
assert.ok(adjusted.some((x) => x.category === "audio"));

const cross = softSuppressCrossShelfProject(
  [
    { projectId: "1", category: "game" },
    { projectId: "9", category: "audio" },
  ],
  2,
  new Set(["1"]),
);
assert.deepEqual(
  cross.map((x) => x.projectId),
  ["9", "1"],
);

const pairs = selectUsagePairs(
  [
    {
      id: "p1",
      sourceProjectId: "s1",
      sourceCategory: "game",
      targetProjectId: "t1",
      targetCategory: "audio",
    },
    {
      id: "p2",
      sourceProjectId: "s2",
      sourceCategory: "game",
      targetProjectId: "t2",
      targetCategory: "audio",
    },
    {
      id: "p3",
      sourceProjectId: "s3",
      sourceCategory: "game",
      targetProjectId: "t3",
      targetCategory: "audio",
    },
    {
      id: "p4",
      sourceProjectId: "s4",
      sourceCategory: "game",
      targetProjectId: "t4",
      targetCategory: "asset",
    },
  ],
  4,
);
assert.equal(pairs.length, 3); // third game>audio blocked by soft cap 2

console.log("home-shelf-selection ok");
