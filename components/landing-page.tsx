import Image from "next/image";
import Link from "next/link";
import { ForgeLogo, LandingPageCanvas } from "@/components/landing-page-canvas";
import { LandingPageScaler } from "@/components/landing-page-scaler";

function LandingPageMobile() {
  return (
    <div className="min-h-dvh bg-[#08080c] text-zinc-100 lg:hidden">
      <div className="relative h-48 overflow-hidden">
        <Image
          src="/images/landing-mock-reference.jpg"
          alt=""
          fill
          className="object-cover object-left-top"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#08080c]/70" />
      </div>
      <div className="space-y-6 px-5 py-6">
        <ForgeLogo />
        <h1 className="text-2xl font-bold">
          ゲームを、<span className="text-violet-400">育てる</span>場所。
        </h1>
        <p className="text-sm text-zinc-300">
          プレイヤーの声が、次の物語をつくる。開発者とプレイヤーが一緒に、最高のゲーム体験を育てていくプラットフォーム。
        </p>
        <div className="flex gap-2">
          <Link href="/login" className="rounded border border-zinc-600 px-3 py-1.5 text-xs">
            ログイン
          </Link>
          <Link href="/login?mode=signup" className="rounded bg-blue-600 px-3 py-1.5 text-xs text-white">
            新規登録
          </Link>
        </div>
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <>
      <LandingPageScaler>
        <LandingPageCanvas />
      </LandingPageScaler>
      <LandingPageMobile />
    </>
  );
}
