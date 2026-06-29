type ErrorLike = {
  message?: unknown;
  code?: unknown;
  details?: unknown;
};

export function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = error.message.trim();
    if (message) {
      return message;
    }
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = (error as ErrorLike).message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  return fallback;
}

export function mapProjectSubmitErrorMessage(error: unknown): string {
  const message = resolveErrorMessage(error, "");
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as ErrorLike).code ?? "")
      : "";

  if (
    message.includes("genres") ||
    message.includes("thumbnail_urls") ||
    message.includes("estimated_play_time") ||
    message.includes("x_url") ||
    message.includes("overview_introduction")
  ) {
    return "投稿に失敗しました。データベースの更新が未適用の可能性があります。しばらくしてから再度お試しください。";
  }

  if (code === "42501" || message.toLowerCase().includes("row-level security")) {
    return "投稿に失敗しました。ログイン状態を確認して、再度お試しください。";
  }

  if (message) {
    return message;
  }

  return "投稿に失敗しました。時間をおいて再度お試しください。";
}
