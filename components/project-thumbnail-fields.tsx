"use client";

import { GripVertical, X } from "lucide-react";
import { useState, type ChangeEvent, type DragEvent } from "react";
import { readImageAsDataUrl } from "@/lib/read-image-as-data-url";
import { reorderArrayItem } from "@/lib/reorder-array-item";
import {
  MAX_PROJECT_THUMBNAILS,
  canAddProjectThumbnails,
} from "@/lib/project-thumbnails";
import { THUMBNAIL_LABEL } from "@/lib/project-form-copy";

type ProjectThumbnailFieldsProps = {
  thumbnails: string[];
  onChange: (thumbnails: string[]) => void;
  inputId: string;
  required?: boolean;
  posterFallback?: {
    projectId: string;
    title: string;
    genre: string;
    phase?: string;
    styleSeed?: string;
  };
};

export function ProjectThumbnailFields({
  thumbnails,
  onChange,
  inputId,
  required = false,
}: ProjectThumbnailFieldsProps) {
  const [fileInputKey, setFileInputKey] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const remaining = MAX_PROJECT_THUMBNAILS - thumbnails.length;
  const canReorder = thumbnails.length > 1;

  async function handleFilesChange(event: ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    if (!files?.length) {
      return;
    }

    const slots = MAX_PROJECT_THUMBNAILS - thumbnails.length;
    const toAdd = Array.from(files).slice(0, slots);
    const dataUrls = await Promise.all(toAdd.map(readImageAsDataUrl));
    onChange([...thumbnails, ...dataUrls]);
    setFileInputKey((key) => key + 1);
  }

  function removeAt(index: number) {
    onChange(thumbnails.filter((_, itemIndex) => itemIndex !== index));
  }

  function handleDragStart(index: number) {
    if (!canReorder) {
      return;
    }
    setDragIndex(index);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>, index: number) {
    if (!canReorder || dragIndex === null || dragIndex === index) {
      return;
    }
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    setDropIndex(index);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>, index: number) {
    event.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDropIndex(null);
      return;
    }
    onChange(reorderArrayItem(thumbnails, dragIndex, index));
    setDragIndex(null);
    setDropIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDropIndex(null);
  }

  return (
    <div>
      <label htmlFor={inputId} className="text-sm font-medium text-zinc-400">
        {THUMBNAIL_LABEL}
        {required ? <span className="ml-1 text-orange-300/90">必須</span> : null}
      </label>
      <input
        id={inputId}
        key={fileInputKey}
        type="file"
        accept="image/*"
        multiple
        disabled={remaining <= 0}
        onChange={handleFilesChange}
        className="mt-3 block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-200 hover:file:bg-zinc-700 disabled:opacity-50"
      />
      {canReorder ? (
        <p className="mt-2 text-xs text-zinc-600">ドラッグで並べ替え</p>
      ) : null}
      {remaining <= 0 ? (
        <p className="mt-2 text-xs text-amber-400/90">最大{MAX_PROJECT_THUMBNAILS}枚までです</p>
      ) : null}

      {thumbnails.length > 0 ? (
        <div className="mt-4 max-h-[min(60vh,28rem)] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {thumbnails.map((url, index) => (
              <div
                key={`${index}-${url.slice(0, 48)}`}
                draggable={canReorder}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(event) => handleDragOver(event, index)}
                onDrop={(event) => handleDrop(event, index)}
                onDragEnd={handleDragEnd}
                className={`group relative overflow-hidden rounded-lg border transition-[opacity,box-shadow] ${
                  dragIndex === index ? "opacity-50" : ""
                } ${
                  dropIndex === index && dragIndex !== null
                    ? "border-violet-400 ring-2 ring-violet-400/40"
                    : "border-zinc-700"
                } ${canReorder ? "cursor-grab active:cursor-grabbing" : ""}`}
              >
                <img
                  src={url}
                  alt={`サムネイル ${index + 1}`}
                  draggable={false}
                  className="aspect-video w-full object-cover"
                />
                {canReorder ? (
                  <span
                    className="absolute left-1.5 top-1.5 rounded bg-zinc-950/80 p-0.5 text-zinc-400"
                    aria-hidden="true"
                  >
                    <GripVertical className="size-3.5" />
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="absolute right-1.5 top-1.5 rounded-full border border-zinc-600 bg-zinc-950/90 p-1 text-zinc-300 opacity-0 transition-opacity hover:border-zinc-500 hover:text-white group-hover:opacity-100"
                  aria-label={`サムネイル ${index + 1} を削除`}
                >
                  <X className="size-3.5" />
                </button>
                {index === 0 ? (
                  <span className="absolute bottom-1.5 left-1.5 rounded bg-zinc-950/80 px-1.5 py-0.5 text-[10px] text-zinc-400">
                    一覧用
                  </span>
                ) : null}
              </div>
            ))}
            {canAddProjectThumbnails(thumbnails.length) ? (
              <label
                htmlFor={inputId}
                className="flex aspect-video cursor-pointer items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 text-xs text-zinc-500 transition-colors hover:border-zinc-600 hover:text-zinc-400"
              >
                ＋ 追加
              </label>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
