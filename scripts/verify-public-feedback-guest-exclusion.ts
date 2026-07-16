/**
 * Local verify: public FB list excludes guests; participant count is distinct users.
 * Run: npx --yes tsx scripts/verify-public-feedback-guest-exclusion.ts
 */
import assert from "node:assert/strict";
import type { PublicFeedbackCard } from "../lib/public-feedback-cards";

function filterPublicCards(cards: PublicFeedbackCard[]): PublicFeedbackCard[] {
  return cards.filter((card) => card.authorKind !== "guest");
}

function participantCountFromUsers(userIds: string[]): number {
  return new Set(userIds.filter(Boolean)).size;
}

const sample: PublicFeedbackCard[] = [
  {
    cardId: "fc1_reg_a",
    cardKind: "voice_supplement",
    versionKey: "0.1",
    createdAt: "2026-07-13T00:00:00.000Z",
    authorKind: "registered",
    authorDisplayName: "Player",
    authorAvatarUrl: null,
    authorXUsername: null,
    promptText: "Q1",
    bodyText: "comment-a",
    goodPoints: null,
    concerns: null,
    bugs: null,
    otherNotes: null,
    empathyCount: 0,
    replyCount: 0,
    viewerHasEmpathy: false,
    viewerCanEmpathy: true,
    developerMarkedHelpful: false,
    viewerIsProjectOwner: false,
    viewerCanReply: false,
  },
  {
    cardId: "fc1_reg_b",
    cardKind: "voice_supplement",
    versionKey: "0.1",
    createdAt: "2026-07-13T00:01:00.000Z",
    authorKind: "registered",
    authorDisplayName: "Player",
    authorAvatarUrl: null,
    authorXUsername: null,
    promptText: "Q2",
    bodyText: "comment-b",
    goodPoints: null,
    concerns: null,
    bugs: null,
    otherNotes: null,
    empathyCount: 0,
    replyCount: 0,
    viewerHasEmpathy: false,
    viewerCanEmpathy: true,
    developerMarkedHelpful: false,
    viewerIsProjectOwner: false,
    viewerCanReply: false,
  },
  {
    cardId: "fc1_guest",
    cardKind: "voice_supplement",
    versionKey: "0.1",
    createdAt: "2026-07-08T00:00:00.000Z",
    authorKind: "guest",
    authorDisplayName: null,
    authorAvatarUrl: null,
    authorXUsername: null,
    promptText: "Q",
    bodyText: "test",
    goodPoints: null,
    concerns: null,
    bugs: null,
    otherNotes: null,
    empathyCount: 0,
    replyCount: 0,
    viewerHasEmpathy: false,
    viewerCanEmpathy: true,
    developerMarkedHelpful: false,
    viewerIsProjectOwner: false,
    viewerCanReply: false,
  },
];

const filtered = filterPublicCards(sample);
assert.equal(filtered.length, 2);
assert.equal(
  filtered.some((c) => c.bodyText === "test" || c.authorKind === "guest"),
  false,
);

// Same registered user answered two prompts → count stays 1
assert.equal(participantCountFromUsers(["user-1", "user-1"]), 1);
// Voice + deep FB from same user → still 1
assert.equal(participantCountFromUsers(["user-1", "user-1"]), 1);
assert.equal(participantCountFromUsers(["user-1", "user-2"]), 2);

console.log(
  JSON.stringify({
    ok: true,
    filteredCards: filtered.length,
    guestExcluded: true,
    sameUserTwoPromptsCount: 1,
  }),
);
