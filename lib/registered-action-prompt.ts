export const REGISTERED_ACTION_PROMPT_TITLE = "この機能はログインが必要です";

export type RegisteredActionPromptVariant =
  | "follow"
  | "bookmark"
  | "watch"
  | "feedback"
  | "play"
  | "default";

const VARIANT_BODIES: Record<RegisteredActionPromptVariant, string> = {
  follow: "クリエイターをフォローすると、更新を追いやすくなります。",
  bookmark: "ログインすると、あとで見る作品として保存できます。",
  watch: "ログインすると、この作品の更新を追えるようになります。",
  feedback: "ログインすると、開発者にフィードバックを届けられます。",
  play: "ログインすると、プレイ履歴やフィードバック導線を使えます。",
  default:
    "ログインすると、この操作を続けられます。ログイン後、このページに戻ります。",
};

export function getRegisteredActionPromptBody(
  variant: RegisteredActionPromptVariant = "default",
): string {
  return VARIANT_BODIES[variant];
}
