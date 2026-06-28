import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import {
  ACCOUNT_DELETE_CONFIRMATION_PHRASE,
  ANONYMIZED_DISPLAY_NAME,
} from "@/lib/account-settings";
import { getAuthErrorMessage } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";

export const runtime = "nodejs";

type AnonymizeRequest = {
  password?: string;
  confirmation?: string;
};

function anonymizedAuthEmail(userId: string): string {
  return `deleted+${userId}@anon.forge.invalid`;
}

export async function POST(request: Request) {
  let body: AnonymizeRequest = {};
  try {
    body = (await request.json()) as AnonymizeRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const confirmation = body.confirmation?.trim() ?? "";
  if (confirmation !== ACCOUNT_DELETE_CONFIRMATION_PHRASE) {
    return NextResponse.json(
      { error: `確認のため「${ACCOUNT_DELETE_CONFIRMATION_PHRASE}」と入力してください。` },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return NextResponse.json({ error: "ログインが必要です。" }, { status: 401 });
  }

  const hasEmailLogin = (user.identities ?? []).some(
    (identity) => identity.provider === "email",
  );
  const password = body.password ?? "";

  if (hasEmailLogin) {
    if (!password) {
      return NextResponse.json({ error: "現在のパスワードを入力してください。" }, { status: 400 });
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });

    if (reauthError) {
      return NextResponse.json(
        { error: getAuthErrorMessage(reauthError.message) },
        { status: 401 },
      );
    }
  }

  const { error: rpcError } = await supabase.rpc("anonymize_own_account_data");

  if (rpcError) {
    const message =
      rpcError.message === "already_anonymized"
        ? "このアカウントは既に退会済みです。"
        : rpcError.message === "not_authenticated"
          ? "ログインが必要です。"
          : rpcError.message.includes("anonymize_own_account_data")
            ? "退会処理に必要な DB 設定が未適用です。しばらくしてからお試しください。"
            : rpcError.message;

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const admin = createServiceRoleClient();
  if (!admin) {
    return NextResponse.json(
      {
        error:
          "退会データは匿名化しましたが、ログイン無効化に失敗しました。運営にお問い合わせください。",
      },
      { status: 503 },
    );
  }

  const randomPassword = `${randomBytes(32).toString("hex")}Aa1!`;
  const { error: adminError } = await admin.auth.admin.updateUserById(user.id, {
    email: anonymizedAuthEmail(user.id),
    password: randomPassword,
    user_metadata: {
      ...user.user_metadata,
      display_name: ANONYMIZED_DISPLAY_NAME,
      anonymized_at: new Date().toISOString(),
    },
    ban_duration: "876000h",
  });

  if (adminError) {
    return NextResponse.json(
      {
        error:
          "退会データは匿名化しましたが、ログイン無効化に失敗しました。運営にお問い合わせください。",
      },
      { status: 500 },
    );
  }

  await supabase.auth.signOut();

  return NextResponse.json({ ok: true });
}
