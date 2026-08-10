/**
 * Pure consultation acknowledge lifecycle (no React / no network).
 * Encodes: never ack before detailOk + uiCommitted; retry detail / retry ack / realtime paths.
 */

export type ConsultationAckEvent =
  | "detailFail"
  | "detailOk"
  | "uiCommitted"
  | "ackFail"
  | "ackOk"
  | "retryDetail"
  | "retryAck"
  | "realtimeMessages";

export type ConsultationAckPhase =
  | "idle"
  | "loading"
  | "detailReady"
  | "uiCommitted"
  | "acking"
  | "acked"
  | "detailError"
  | "ackError";

export type ConsultationAckState = {
  phase: ConsultationAckPhase;
  detailOk: boolean;
  uiCommitted: boolean;
};

export function createConsultationAckState(): ConsultationAckState {
  return { phase: "idle", detailOk: false, uiCommitted: false };
}

/** True only after detailOk + uiCommitted (and not already acking/acked without a new cycle). */
export function consultationAckMayRun(state: ConsultationAckState): boolean {
  return state.detailOk && state.uiCommitted && state.phase === "uiCommitted";
}

export function consultationAckMayScheduleUiCommit(
  state: ConsultationAckState,
): boolean {
  return state.detailOk && state.phase === "detailReady";
}

export function reduceConsultationAck(
  state: ConsultationAckState,
  event: ConsultationAckEvent,
): ConsultationAckState {
  switch (event) {
    case "detailFail":
      return { phase: "detailError", detailOk: false, uiCommitted: false };

    case "detailOk":
      // Detail loaded into memory; UI commit is a separate event (React commit / paint gate).
      return { phase: "detailReady", detailOk: true, uiCommitted: false };

    case "uiCommitted":
      if (!state.detailOk) {
        // Never treat UI commit as ack-ready without a successful detail load.
        return state;
      }
      return { phase: "uiCommitted", detailOk: true, uiCommitted: true };

    case "ackFail":
      if (!(state.detailOk && state.uiCommitted)) {
        return state;
      }
      return { ...state, phase: "ackError" };

    case "ackOk":
      if (!(state.detailOk && state.uiCommitted)) {
        return state;
      }
      return { ...state, phase: "acked" };

    case "retryDetail":
      return { phase: "loading", detailOk: false, uiCommitted: false };

    case "retryAck":
      if (!(state.detailOk && state.uiCommitted)) {
        return state;
      }
      return { ...state, phase: "acking" };

    case "realtimeMessages":
      // New messages: if detail already ok, re-open uiCommitted → ack cycle; else ignore for ack.
      if (!state.detailOk) {
        return state;
      }
      return { phase: "detailReady", detailOk: true, uiCommitted: false };

    default: {
      const _exhaustive: never = event;
      return _exhaustive;
    }
  }
}

/** Transition helper: after reduce(uiCommitted), caller should start ack IFF mayRun. */
export function applyConsultationAckEvent(
  state: ConsultationAckState,
  event: ConsultationAckEvent,
): { state: ConsultationAckState; shouldStartAck: boolean } {
  const next = reduceConsultationAck(state, event);
  if (event === "uiCommitted" && consultationAckMayRun(next)) {
    return { state: { ...next, phase: "acking" }, shouldStartAck: true };
  }
  if (event === "retryAck" && next.phase === "acking") {
    return { state: next, shouldStartAck: true };
  }
  return { state: next, shouldStartAck: false };
}
