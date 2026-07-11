"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  RELATED_LINK_KIND_LABELS,
  RELATED_LINK_KINDS,
  createEmptyRelatedLink,
  type RelatedLink,
  type RelatedLinkKind,
} from "@/lib/project-publish-links";

type RelatedLinksFormFieldsProps = {
  value: RelatedLink[];
  onChange: (next: RelatedLink[]) => void;
  inputClassName: string;
  formKey?: string;
};

export function RelatedLinksFormFields({
  value,
  onChange,
  inputClassName,
}: RelatedLinksFormFieldsProps) {
  function updateAt(index: number, patch: Partial<RelatedLink>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function addLink() {
    onChange([
      ...value,
      createEmptyRelatedLink({
        kind: "note_blog",
        label: null,
      }),
    ]);
  }

  return (
    <div className="space-y-4 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          関連リンク <span className="font-normal text-zinc-600">（任意）</span>
        </p>
      </div>

      {value.length === 0 ? (
        <p className="text-xs text-zinc-600">まだ関連リンクはありません</p>
      ) : (
        <ul className="space-y-4">
          {value.map((item, index) => (
            <li
              key={item.id}
              className="space-y-3 rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium text-zinc-500">関連リンク</span>
                <button
                  type="button"
                  onClick={() => removeAt(index)}
                  className="rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                  aria-label="関連リンクを削除"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>

              <div>
                <label
                  htmlFor={`related-kind-${item.id}`}
                  className="text-sm text-zinc-500"
                >
                  関連リンクの種類
                </label>
                <select
                  id={`related-kind-${item.id}`}
                  value={item.kind}
                  onChange={(event) =>
                    updateAt(index, {
                      kind: event.target.value as RelatedLinkKind,
                    })
                  }
                  className={inputClassName}
                >
                  {RELATED_LINK_KINDS.map((kind) => (
                    <option key={kind} value={kind}>
                      {RELATED_LINK_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`related-url-${item.id}`}
                  className="text-sm text-zinc-500"
                >
                  URL
                </label>
                <input
                  id={`related-url-${item.id}`}
                  type="url"
                  value={item.url}
                  onChange={(event) => updateAt(index, { url: event.target.value })}
                  className={inputClassName}
                  placeholder="https://..."
                />
              </div>

              <div>
                <label
                  htmlFor={`related-label-${item.id}`}
                  className="text-sm text-zinc-500"
                >
                  表示名 <span className="font-normal text-zinc-600">（任意）</span>
                </label>
                <input
                  id={`related-label-${item.id}`}
                  type="text"
                  value={item.label ?? ""}
                  onChange={(event) =>
                    updateAt(index, {
                      label: event.target.value.trim() ? event.target.value : null,
                    })
                  }
                  className={inputClassName}
                  placeholder="例: 制作記録 #3"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={addLink}
        className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-300"
      >
        <Plus className="size-3.5" aria-hidden="true" />
        関連リンクを追加
      </button>
    </div>
  );
}
