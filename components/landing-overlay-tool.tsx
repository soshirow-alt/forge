"use client";

import Image from "next/image";
import { useState } from "react";
import {
  LandingPageCanvas,
  LandingPageCanvasCompare,
} from "@/components/landing-page-canvas";
import { MOCK_H, MOCK_W } from "@/components/landing-mock-layout";

type CompareMode = "side-by-side" | "overlay" | "toggle";

export function LandingOverlayTool() {
  const [mode, setMode] = useState<CompareMode>("side-by-side");
  const [showMock, setShowMock] = useState(true);

  return (
    <div className="flex w-full max-w-[2400px] flex-col items-center gap-4 px-4 py-6">
      <p className="text-center text-xs text-zinc-500">
        01 LP モック比較（preview のみ）— 原寸 {MOCK_W}×{MOCK_H}
      </p>

      <div className="flex flex-wrap justify-center gap-2">
        {(
          [
            ["side-by-side", "左右比較"],
            ["overlay", "重ね（モック50% + 実装100%）"],
            ["toggle", "表示切替"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            className={`rounded border px-3 py-1.5 text-xs ${
              mode === id
                ? "border-violet-500/60 bg-violet-500/15 text-violet-200"
                : "border-zinc-700 text-zinc-400 hover:border-zinc-500"
            }`}
          >
            {label}
          </button>
        ))}
        {mode === "toggle" ? (
          <button
            type="button"
            onClick={() => setShowMock((v) => !v)}
            className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-500"
          >
            現在: {showMock ? "モック" : "実装"}（クリックで切替）
          </button>
        ) : null}
      </div>

      {mode === "side-by-side" ? (
        <div className="flex flex-col items-center gap-3 lg:flex-row lg:items-start">
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-500">モック原寸</span>
            <Image
              src="/images/landing-mock-reference.jpg"
              alt="モック"
              width={MOCK_W}
              height={MOCK_H}
              className="max-w-none border border-zinc-800"
              style={{ width: MOCK_W, height: MOCK_H }}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] text-zinc-500">実装</span>
            <div className="border border-zinc-800">
              <LandingPageCanvas />
            </div>
          </div>
        </div>
      ) : null}

      {mode === "overlay" ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-zinc-500">下: モック 50% / 上: 実装 100%（ヒーロー背景は下層モックのみ）</span>
          <div className="relative border border-zinc-800" style={{ width: MOCK_W, height: MOCK_H }}>
            <Image
              src="/images/landing-mock-reference.jpg"
              alt=""
              width={MOCK_W}
              height={MOCK_H}
              className="absolute left-0 top-0 max-w-none opacity-50"
              style={{ width: MOCK_W, height: MOCK_H }}
            />
            <div className="absolute left-0 top-0">
              <LandingPageCanvasCompare />
            </div>
          </div>
        </div>
      ) : null}

      {mode === "toggle" ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-zinc-500">{showMock ? "モック表示中" : "実装表示中"}</span>
          <div className="border border-zinc-800" style={{ width: MOCK_W, height: MOCK_H }}>
            {showMock ? (
              <Image
                src="/images/landing-mock-reference.jpg"
                alt="モック"
                width={MOCK_W}
                height={MOCK_H}
                className="max-w-none"
                style={{ width: MOCK_W, height: MOCK_H }}
              />
            ) : (
              <LandingPageCanvas />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
