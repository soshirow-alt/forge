import { NextResponse } from "next/server";

export type GuestFeedbackErrorCode =
  | "project_not_found"
  | "project_not_public"
  | "invalid_version_key"
  | "invalid_prompt"
  | "prompt_archived"
  | "invalid_answer"
  | "validation_error"
  | "empty_detailed_feedback"
  | "submitter_key_missing"
  | "submitter_key_invalid"
  | "rate_limited"
  | "guest_feedback_disabled"
  | "supabase_not_configured"
  | "internal_error";

const ERROR_MESSAGES: Record<GuestFeedbackErrorCode, string> = {
  project_not_found: "作品が見つかりません。",
  project_not_public: "この作品は公開されていないため、フィードバックを送信できません。",
  invalid_version_key: "指定されたバージョンが無効です。",
  invalid_prompt: "指定された問いが無効です。",
  prompt_archived: "この問いは現在受け付けていません。",
  invalid_answer: "回答内容が正しくありません。",
  validation_error: "入力内容を確認してください。",
  empty_detailed_feedback: "詳しい感想のいずれかの項目を入力してください。",
  submitter_key_missing: "送信の準備ができていません。ページを再読み込みしてください。",
  submitter_key_invalid: "送信の準備が無効です。ページを再読み込みしてください。",
  rate_limited: "送信回数が上限に達しました。しばらくしてから再度お試しください。",
  guest_feedback_disabled:
    "フィードバックの送信にはログインが必要です。ゲストでは送信できません。",
  supabase_not_configured: "サービスが準備中です。",
  internal_error: "送信に失敗しました。時間をおいて再度お試しください。",
};

const ERROR_STATUS: Record<GuestFeedbackErrorCode, number> = {
  project_not_found: 404,
  project_not_public: 403,
  invalid_version_key: 400,
  invalid_prompt: 400,
  prompt_archived: 400,
  invalid_answer: 400,
  validation_error: 400,
  empty_detailed_feedback: 400,
  submitter_key_missing: 400,
  submitter_key_invalid: 400,
  rate_limited: 429,
  guest_feedback_disabled: 403,
  supabase_not_configured: 503,
  internal_error: 500,
};

export function guestFeedbackErrorResponse(
  code: GuestFeedbackErrorCode,
  message?: string,
) {
  return NextResponse.json(
    {
      ok: false as const,
      code,
      message: message ?? ERROR_MESSAGES[code],
    },
    { status: ERROR_STATUS[code] },
  );
}

export function guestFeedbackOkResponse<T extends Record<string, unknown>>(
  body: T,
  status = 200,
) {
  return NextResponse.json({ ok: true as const, ...body }, { status });
}
