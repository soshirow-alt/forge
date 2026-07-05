import type { GuestFeedbackErrorCode } from "@/lib/guest-feedback/errors";
import type {
  GuestDetailedFeedbackInput,
  GuestVoiceAnswerInput,
  PostGuestFeedbackResponseBody,
  PostGuestVoiceRequest,
  PostGuestVoiceResponseBody,
} from "@/lib/guest-feedback/types";

type GuestApiFailure = {
  ok: false;
  code: GuestFeedbackErrorCode;
  message: string;
};

async function readGuestApiBody<T extends { ok: boolean }>(response: Response): Promise<T> {
  const body = (await response.json()) as T | GuestApiFailure;
  if (!body.ok) {
    const message =
      "message" in body && typeof body.message === "string"
        ? body.message
        : "送信に失敗しました。時間をおいて再度お試しください。";
    throw new Error(message);
  }
  return body;
}

export async function ensureGuestSubmitter(): Promise<string> {
  const response = await fetch("/api/guest/submitter", {
    method: "POST",
    credentials: "include",
  });
  const body = await readGuestApiBody<{ ok: true; submitterKey: string }>(response);
  return body.submitterKey;
}

export async function postGuestVoice(
  projectId: string,
  versionKey: string,
  answers: GuestVoiceAnswerInput[],
): Promise<PostGuestVoiceResponseBody> {
  await ensureGuestSubmitter();
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/guest-voice`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ versionKey, answers } satisfies PostGuestVoiceRequest),
    },
  );
  return readGuestApiBody<PostGuestVoiceResponseBody & { ok: true }>(response);
}

export async function postGuestFeedback(
  projectId: string,
  input: GuestDetailedFeedbackInput,
): Promise<PostGuestFeedbackResponseBody> {
  await ensureGuestSubmitter();
  const response = await fetch(
    `/api/projects/${encodeURIComponent(projectId)}/guest-feedback`,
    {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  return readGuestApiBody<PostGuestFeedbackResponseBody & { ok: true }>(response);
}
