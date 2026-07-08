"use client";

import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  EXTERNAL_LINK_FORM_SPECS,
  EXTERNAL_LINK_GROUPS,
  PROJECT_LINKS_SECTION_HINT,
  PROJECT_LINKS_SECTION_TITLE,
  STORE_EXTERNAL_LINK_KEYS,
  externalLinkKeysWithValues,
  getExternalLinkSpec,
  type ExternalLinkFormKey,
  type ExternalLinkFormValues,
  type ProjectExternalLinksInput,
} from "@/lib/game-links";

type ExternalLinksFormFieldsProps = {
  values: ExternalLinkFormValues;
  onChange: (field: keyof ProjectExternalLinksInput, value: string) => void;
  inputClassName: string;
  /** Remount when editing a different project (seeds visible fields from saved URLs). */
  formKey?: string;
};

function LinkField({
  linkKey,
  values,
  onChange,
  onRemove,
  inputClassName,
}: {
  linkKey: ExternalLinkFormKey;
  values: ExternalLinkFormValues;
  onChange: (field: keyof ProjectExternalLinksInput, value: string) => void;
  onRemove: (key: ExternalLinkFormKey) => void;
  inputClassName: string;
}) {
  const spec = getExternalLinkSpec(linkKey);
  return (
    <li>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={`external-${linkKey}`} className="text-sm text-zinc-500">
          {spec.label}
        </label>
        <button
          type="button"
          onClick={() => onRemove(linkKey)}
          className="rounded-lg p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          aria-label={`${spec.label} を削除`}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <input
        id={`external-${linkKey}`}
        type="url"
        value={values[spec.field]}
        onChange={(event) => onChange(spec.field, event.target.value)}
        className={inputClassName}
        placeholder={spec.placeholder}
      />
    </li>
  );
}

export function ExternalLinksFormFields({
  values,
  onChange,
  inputClassName,
  formKey,
}: ExternalLinksFormFieldsProps) {
  const [visibleKeys, setVisibleKeys] = useState<ExternalLinkFormKey[]>([]);

  useEffect(() => {
    setVisibleKeys(externalLinkKeysWithValues(values));
  }, [formKey]);

  useEffect(() => {
    const keysWithValues = externalLinkKeysWithValues(values);
    if (keysWithValues.length === 0) {
      return;
    }
    setVisibleKeys((current) => {
      const merged = new Set([...current, ...keysWithValues]);
      return EXTERNAL_LINK_FORM_SPECS.filter((spec) => merged.has(spec.key)).map(
        (spec) => spec.key,
      );
    });
  }, [values]);

  const legacyStoreKeys = useMemo(
    () =>
      STORE_EXTERNAL_LINK_KEYS.filter(
        (key) => visibleKeys.includes(key) || Boolean(values[getExternalLinkSpec(key).field]?.trim()),
      ),
    [visibleKeys, values],
  );

  function addLink(key: ExternalLinkFormKey) {
    setVisibleKeys((current) =>
      current.includes(key) ? current : [...current, key],
    );
  }

  function removeLink(key: ExternalLinkFormKey) {
    const spec = getExternalLinkSpec(key);
    onChange(spec.field, "");
    setVisibleKeys((current) => current.filter((item) => item !== key));
  }

  return (
    <div className="space-y-5 rounded-lg border border-zinc-800 bg-zinc-950/50 p-4">
      <div>
        <p className="text-sm font-medium text-zinc-400">
          {PROJECT_LINKS_SECTION_TITLE}{" "}
          <span className="font-normal text-zinc-600">（任意）</span>
        </p>
        <p className="mt-1 text-xs text-zinc-500">{PROJECT_LINKS_SECTION_HINT}</p>
      </div>

      {legacyStoreKeys.length > 0 ? (
        <section className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4">
          <h3 className="text-sm font-medium text-zinc-300">追加の販売・配布ページ</h3>
          <p className="mt-1 text-xs text-zinc-500">
            メインの遊び先は「プレイ情報」に入力します。
          </p>
          <ul className="mt-3 space-y-3">
            {legacyStoreKeys.map((key) => (
              <LinkField
                key={key}
                linkKey={key}
                values={values}
                onChange={onChange}
                onRemove={removeLink}
                inputClassName={inputClassName}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {EXTERNAL_LINK_GROUPS.map((group) => {
        const visibleInGroup = group.keys.filter((key) => visibleKeys.includes(key));
        const hiddenInGroup = group.keys.filter((key) => !visibleKeys.includes(key));

        return (
          <section
            key={group.id}
            className="rounded-xl border border-zinc-800/80 bg-zinc-900/30 p-4"
          >
            <h3 className="text-sm font-medium text-zinc-300">{group.title}</h3>

            {visibleInGroup.length > 0 ? (
              <ul className="mt-3 space-y-3">
                {visibleInGroup.map((key) => (
                  <LinkField
                    key={key}
                    linkKey={key}
                    values={values}
                    onChange={onChange}
                    onRemove={removeLink}
                    inputClassName={inputClassName}
                  />
                ))}
              </ul>
            ) : null}

            {hiddenInGroup.length > 0 ? (
              <div className={`${visibleInGroup.length > 0 ? "mt-3" : "mt-1"} flex flex-wrap gap-2`}>
                {hiddenInGroup.map((key) => {
                  const spec = getExternalLinkSpec(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => addLink(key)}
                      className="inline-flex items-center gap-1 rounded-lg border border-dashed border-zinc-700 bg-zinc-950/40 px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:border-orange-500/40 hover:text-orange-300"
                    >
                      <Plus className="size-3.5" aria-hidden="true" />
                      {spec.label}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
