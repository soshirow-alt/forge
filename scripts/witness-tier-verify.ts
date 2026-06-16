/**
 * Witness tier — pure logic verify (T1)
 */
import { resolveWitnessTier, WITNESS_TIER_DEFINITIONS } from "../lib/witness-tier";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

function main() {
  console.log("=== Witness tier verify ===");

  assert(resolveWitnessTier(0) === null, "0 grants → null");
  assert(resolveWitnessTier(-1) === null, "negative → null");

  assert(resolveWitnessTier(1)?.label === "見届け人", "1 → 見届け人");
  assert(resolveWitnessTier(2)?.label === "見届け人", "2 → 見届け人");
  assert(resolveWitnessTier(3)?.label === "見届け人 Silver", "3 → Silver");
  assert(resolveWitnessTier(9)?.label === "見届け人 Silver", "9 → Silver");
  assert(resolveWitnessTier(10)?.label === "見届け人 Gold", "10 → Gold");
  assert(resolveWitnessTier(99)?.label === "見届け人 Gold", "99 → Gold");

  assert(WITNESS_TIER_DEFINITIONS.length === 3, "3 tier definitions");
  assert(
    WITNESS_TIER_DEFINITIONS.every((tier) => tier.summary.length > 0),
    "summaries present",
  );

  console.log("Definitions:");
  for (const tier of WITNESS_TIER_DEFINITIONS) {
    console.log(`  ${tier.minProjects}+ → ${tier.label}`);
  }

  console.log("\nPASS — witness tier logic OK");
}

main();
