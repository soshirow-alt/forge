"use client";

import { useRef, useState } from "react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileAvatarPresets } from "@/lib/profile-avatar-presets";
import {
  ProfileAvatarUserError,
  compressAvatarFileForPreview,
} from "@/lib/profile-avatar-client";
import { Upload } from "lucide-react";

type ProfileAvatarPickerProps = {
  value: string;
  onChange: (src: string) => void;
};

export function ProfileAvatarPicker({ value, onChange }: ProfileAvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);
  const [reading, setReading] = useState(false);

  async function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPickerError(null);
    setReading(true);
    try {
      const preview = await compressAvatarFileForPreview(file);
      onChange(preview);
    } catch (error) {
      const message =
        error instanceof ProfileAvatarUserError
          ? error.message
          : "画像の読み込みに失敗しました。JPG / PNG / WebP をお試しください。";
      console.error("[profile-avatar-picker]", error);
      setPickerError(message);
    } finally {
      setReading(false);
    }
  }

  return (
    <fieldset>
      <legend className="text-xs font-medium text-zinc-500">プロフィールアイコン</legend>
      <div className="mt-2 flex items-center gap-4">
        <ProfileAvatar src={value} className="size-16" size={64} />
        <div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={reading}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            {reading ? "読み込み中…" : "画像をアップロード"}
          </button>
          <p className="mt-1 text-[11px] text-zinc-600">
            JPG / PNG / WebP（5MB以下）
          </p>
          {pickerError ? (
            <p className="mt-1 text-[11px] text-rose-300">{pickerError}</p>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
          className="hidden"
          onChange={(event) => void handleUpload(event)}
        />
      </div>
      <div className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2">
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {profileAvatarPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => {
                setPickerError(null);
                onChange(preset.src);
              }}
              className={`rounded-full p-0.5 transition-colors ${
                value === preset.src
                  ? "ring-2 ring-violet-500 ring-offset-2 ring-offset-zinc-950"
                  : "hover:ring-1 hover:ring-zinc-600"
              }`}
            >
              <ProfileAvatar src={preset.src} className="size-9" size={36} />
            </button>
          ))}
        </div>
      </div>
    </fieldset>
  );
}
