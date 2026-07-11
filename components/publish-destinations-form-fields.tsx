"use client";

import { Plus, Star, Trash2 } from "lucide-react";
import {
  PUBLISH_DESTINATION_KIND_LABELS,
  PUBLISH_DESTINATION_KINDS,
  PUBLISH_USAGE_METHOD_LABELS,
  PUBLISH_USAGE_METHODS,
  createEmptyPublishDestination,
  normalizePrimaryFlag,
  publishKindNeedsUsageMethod,
  type PublishDestination,
  type PublishDestinationKind,
  type PublishUsageMethod,
} from "@/lib/project-publish-links";

type PublishDestinationsFormFieldsProps = {
  value: PublishDestination[];
  onChange: (next: PublishDestination[]) => void;
  inputClassName: string;
  formKey?: string;
};

function ensureAtLeastPrimary(items: PublishDestination[]): PublishDestination[] {
  if (items.length === 0) {
    return [
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "other",
        isPrimary: true,
      }),
    ];
  }
  return normalizePrimaryFlag(items);
}

export function PublishDestinationsFormFields({
  value,
  onChange,
  inputClassName,
}: PublishDestinationsFormFieldsProps) {
  const items = ensureAtLeastPrimary(value);

  function updateAt(index: number, patch: Partial<PublishDestination>) {
    const next = items.map((item, i) => {
      if (i !== index) {
        return item;
      }
      const merged = { ...item, ...patch };
      if (patch.kind !== undefined) {
        merged.usageMethod = publishKindNeedsUsageMethod(patch.kind)
          ? merged.usageMethod ?? "other"
          : null;
      }
      return merged;
    });
    onChange(normalizePrimaryFlag(next));
  }

  function setPrimary(index: number) {
    onChange(
      items.map((item, i) => ({
        ...item,
        isPrimary: i === index,
      })),
    );
  }

  function removeAt(index: number) {
    if (items.length <= 1) {
      onChange(
        ensureAtLeastPrimary([
          createEmptyPublishDestination({
            kind: "other",
            usageMethod: "other",
            isPrimary: true,
          }),
        ]),
      );
      return;
    }
    onChange(normalizePrimaryFlag(items.filter((_, i) => i !== index)));
  }

  function addDestination() {
    onChange([
      ...items,
      createEmptyPublishDestination({
        kind: "other",
        usageMethod: "other",
        isPrimary: false,
      }),
    ]);
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          公開先 <span className="font-normal text-zinc-600">（メイン必須）</span>
        </p>
      </div>

      <ul className="space-y-4">
        {items.map((item, index) => {
          const needsUsage = publishKindNeedsUsageMethod(item.kind);
          return (
            <li
              key={item.id}
              className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">
                  {item.isPrimary ? "メイン公開先" : "その他の公開先"}
                </span>
                <div className="flex items-center gap-1">
                  {!item.isPrimary ? (
                    <button
                      type="button"
                      onClick={() => setPrimary(index)}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-amber-300"
                    >
                      <Star className="size-3.5" aria-hidden="true" />
                      メインにする
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-amber-300/90">
                      <Star className="size-3.5 fill-current" aria-hidden="true" />
                      メイン
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => removeAt(index)}
                    className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    aria-label="公開先を削除"
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor={`publish-kind-${item.id}`}
                  className="text-sm text-zinc-500"
                >
                  公開先の種類
                </label>
                <select
                  id={`publish-kind-${item.id}`}
                  value={item.kind}
                  onChange={(event) =>
                    updateAt(index, {
                      kind: event.target.value as PublishDestinationKind,
                    })
                  }
                  className={inputClassName}
                >
                  {PUBLISH_DESTINATION_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {PUBLISH_DESTINATION_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`publish-url-${item.id}`}
                  className="text-sm text-zinc-500"
                >
                  URL
                </label>
                <input
                  id={`publish-url-${item.id}`}
                  type="url"
                  value={item.url}
                  onChange={(event) => updateAt(index, { url: event.target.value })}
                  className={inputClassName}
                  placeholder="https://..."
                  required={item.isPrimary}
                />
              </div>

              {needsUsage ? (
                <div>
                  <label
                    htmlFor={`publish-usage-${item.id}`}
                    className="text-sm text-zinc-500"
                  >
                    利用方法
                  </label>
                  <select
                    id={`publish-usage-${item.id}`}
                    value={item.usageMethod ?? "other"}
                    onChange={(event) =>
                      updateAt(index, {
                        usageMethod: event.target.value as PublishUsageMethod,
                      })
                    }
                    className={inputClassName}
                  >
                    {PUBLISH_USAGE_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {PUBLISH_USAGE_METHOD_LABELS[method]}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={addDestination}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-300"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        公開先を追加
      </button>
    </div>
  );
}
