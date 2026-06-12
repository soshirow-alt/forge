import { FORGE_SDK_NOTE } from "@/lib/forge-sdk-note";

type ForgeSdkNoteProps = {
  className?: string;
};

export function ForgeSdkNote({ className = "" }: ForgeSdkNoteProps) {
  return (
    <p
      className={`text-xs leading-relaxed text-zinc-500 ${className}`.trim()}
    >
      {FORGE_SDK_NOTE}
    </p>
  );
}
