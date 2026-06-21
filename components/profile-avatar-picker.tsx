"use client";

import { useRef } from "react";
import { ProfileAvatar } from "@/components/profile-avatar";
import { profileAvatarPresets } from "@/lib/profile-avatar-presets";
import { Upload } from "lucide-react";

type ProfileAvatarPickerProps = {
  value: string;
  onChange: (src: string) => void;
};

export function ProfileAvatarPicker({ value, onChange }: ProfileAvatarPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onChange(reader.result);
      }
    };
    reader.readAsDataURL(file);
    event.target.value = "";
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
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-700 px-3 py-2 text-xs text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
          >
            <Upload className="size-3.5" aria-hidden="true" />
            画像をアップロード
          </button>
          <p className="mt-1 text-[11px] text-zinc-600">JPG / PNG など（preview は端末内のみ）</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>
      <div className="mt-3 max-h-36 overflow-y-auto rounded-xl border border-zinc-800/80 bg-zinc-950/40 p-2">
        <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-10">
          {profileAvatarPresets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              title={preset.label}
              onClick={() => onChange(preset.src)}
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
