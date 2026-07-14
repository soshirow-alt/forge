import assert from "node:assert/strict";
import { isUsableThumbnailBitmap } from "../lib/thumbnail-bitmap";

// REALIA production cover: 424×294 — must remain usable in wide cards.
assert.equal(isUsableThumbnailBitmap(424, 294), true);
assert.equal(isUsableThumbnailBitmap(192, 133), true);
assert.equal(isUsableThumbnailBitmap(1, 1), true);
assert.equal(isUsableThumbnailBitmap(0, 294), false);
assert.equal(isUsableThumbnailBitmap(424, 0), false);
assert.equal(isUsableThumbnailBitmap(-1, 10), false);

// Former buggy gate would reject REALIA in wide grid/hero cells:
const displayW = 900;
const realiaW = 424;
assert.equal(realiaW * 2 < displayW, true); // old check failed
assert.equal(isUsableThumbnailBitmap(realiaW, 294), true); // fixed

console.log("ok: thumbnail bitmap usability (no display-width reject)");
