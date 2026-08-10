/**
 * Executable lifecycle sequences for consultation ack (no RTL / vitest).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  applyConsultationAckEvent,
  consultationAckMayRun,
  consultationAckMayScheduleUiCommit,
  createConsultationAckState,
  reduceConsultationAck,
  type ConsultationAckEvent,
  type ConsultationAckState,
} from "../lib/collab/consultation-ack-lifecycle";

function runSequence(
  events: ConsultationAckEvent[],
): { state: ConsultationAckState; startedAck: number } {
  let state = createConsultationAckState();
  let startedAck = 0;
  for (const event of events) {
    const applied = applyConsultationAckEvent(state, event);
    state = applied.state;
    if (applied.shouldStartAck) startedAck += 1;
  }
  return { state, startedAck };
}

function assertNoAckBeforeCommit() {
  let state = createConsultationAckState();
  state = reduceConsultationAck(state, "detailOk");
  assert.equal(state.phase, "detailReady");
  assert.equal(consultationAckMayRun(state), false);
  assert.equal(consultationAckMayScheduleUiCommit(state), true);
  // uiCommitted without prior detailOk is ignored when detail was never ok —
  // start from idle and fire uiCommitted alone:
  const idle = createConsultationAckState();
  const ignored = reduceConsultationAck(idle, "uiCommitted");
  assert.equal(ignored.phase, "idle");
  assert.equal(consultationAckMayRun(ignored), false);
}

function assertHappyPath() {
  const { state, startedAck } = runSequence([
    "detailOk",
    "uiCommitted",
    "ackOk",
  ]);
  assert.equal(startedAck, 1);
  assert.equal(state.phase, "acked");
  assert.equal(state.detailOk, true);
  assert.equal(state.uiCommitted, true);
}

function assertAckFailThenRetry() {
  const { state, startedAck } = runSequence([
    "detailOk",
    "uiCommitted",
    "ackFail",
    "retryAck",
    "ackOk",
  ]);
  assert.equal(startedAck, 2); // first uiCommitted + retryAck
  assert.equal(state.phase, "acked");
}

function assertDetailFailThenRetry() {
  const { state, startedAck } = runSequence([
    "detailFail",
    "retryDetail",
    "detailOk",
    "uiCommitted",
    "ackOk",
  ]);
  assert.equal(startedAck, 1);
  assert.equal(state.phase, "acked");
}

function assertRealtimeReopensAckCycle() {
  const mid = runSequence(["detailOk", "uiCommitted", "ackOk"]);
  assert.equal(mid.state.phase, "acked");
  const afterRealtime = applyConsultationAckEvent(
    mid.state,
    "realtimeMessages",
  );
  assert.equal(afterRealtime.shouldStartAck, false);
  assert.equal(afterRealtime.state.phase, "detailReady");
  assert.equal(afterRealtime.state.uiCommitted, false);
  const recommit = applyConsultationAckEvent(
    afterRealtime.state,
    "uiCommitted",
  );
  assert.equal(recommit.shouldStartAck, true);
  assert.equal(recommit.state.phase, "acking");
}

function assertAckEventsIgnoredWithoutDetail() {
  let state = createConsultationAckState();
  state = reduceConsultationAck(state, "ackOk");
  assert.equal(state.phase, "idle");
  state = reduceConsultationAck(state, "ackFail");
  assert.equal(state.phase, "idle");
  state = reduceConsultationAck(state, "retryAck");
  assert.equal(state.phase, "idle");
  state = reduceConsultationAck(state, "realtimeMessages");
  assert.equal(state.phase, "idle");
}

/** A: detail GET success → ui commit → ack eligible */
function assertCaseADetailSuccessAckEligible() {
  const { state, startedAck } = runSequence(["detailOk", "uiCommitted"]);
  assert.equal(startedAck, 1);
  assert.equal(state.detailOk, true);
  assert.equal(state.phase, "acking");
}

/** B: detail GET failure → Realtime must not make ack eligible */
function assertCaseBDetailFailRealtimeNoAck() {
  const afterFail = runSequence(["detailFail", "realtimeMessages", "uiCommitted"]);
  assert.equal(afterFail.startedAck, 0);
  assert.equal(afterFail.state.detailOk, false);
  assert.equal(afterFail.state.phase, "detailError");
}

/** C: retry GET success → render commit → ack */
function assertCaseCRetryDetailThenAck() {
  const { state, startedAck } = runSequence([
    "detailFail",
    "realtimeMessages",
    "retryDetail",
    "detailOk",
    "uiCommitted",
    "ackOk",
  ]);
  assert.equal(startedAck, 1);
  assert.equal(state.phase, "acked");
  assert.equal(state.detailOk, true);
}

/** D: list click alone (no detailOk) → never ack */
function assertCaseDListClickAloneNoAck() {
  const idle = createConsultationAckState();
  const afterUi = applyConsultationAckEvent(idle, "uiCommitted");
  assert.equal(afterUi.shouldStartAck, false);
  assert.equal(afterUi.state.detailOk, false);
  const afterRt = applyConsultationAckEvent(afterUi.state, "realtimeMessages");
  assert.equal(afterRt.shouldStartAck, false);
  assert.equal(afterRt.state.detailOk, false);
}

function assertThreadWiresDetailOkSeparatelyFromRealtime() {
  const thread = readFileSync(
    join(process.cwd(), "components/consultation-thread.tsx"),
    "utf8",
  );
  assert.match(thread, /recordDetailOkAndScheduleAck/);
  assert.match(thread, /scheduleAckOnlyIfDetailAlreadyOk/);
  assert.match(thread, /Realtime must not promote detailOk/);
  assert.doesNotMatch(thread, /scheduleAckAfterUiCommit/);
}

assertNoAckBeforeCommit();
assertHappyPath();
assertAckFailThenRetry();
assertDetailFailThenRetry();
assertRealtimeReopensAckCycle();
assertAckEventsIgnoredWithoutDetail();
assertCaseADetailSuccessAckEligible();
assertCaseBDetailFailRealtimeNoAck();
assertCaseCRetryDetailThenAck();
assertCaseDListClickAloneNoAck();
assertThreadWiresDetailOkSeparatelyFromRealtime();

console.log("PASS verify-consultation-ack-lifecycle");
