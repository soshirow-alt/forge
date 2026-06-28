export const ANONYMIZED_DISPLAY_NAME = "退会済みユーザー";
export const ACCOUNT_DELETE_CONFIRMATION_PHRASE = "退会する";
export const ACCOUNT_PASSWORD_MIN_LENGTH = 8;

export function hasEmailPasswordIdentity(
  identities: ReadonlyArray<{ provider: string }> | undefined,
): boolean {
  return (identities ?? []).some((identity) => identity.provider === "email");
}
