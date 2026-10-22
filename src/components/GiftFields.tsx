"use client";

import type { DesignMeta } from "@/designs/types";
import type { GiftContent } from "@/lib/db/schema";
import { PhotoPicker } from "./PhotoPicker";

/** The words-and-photos part of the form, shared by the builder and the edit page. */
export function GiftFields({
  design,
  content,
  onChange,
}: {
  design: DesignMeta;
  content: GiftContent;
  onChange: (c: GiftContent) => void;
}) {
  const setField = (key: string, value: string) => onChange({ ...content, fields: { ...content.fields, [key]: value } });
  const [names, rest] = [design.fields.slice(0, 2), design.fields.slice(2)];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {names.map((f) => (
          <label key={f.key}>
            <span className="label">{f.label}</span>
            <input
              className="input"
              value={content.fields[f.key] ?? ""}
              onChange={(e) => setField(f.key, e.target.value)}
              maxLength={f.max}
              placeholder={f.placeholder}
            />
          </label>
        ))}
      </div>
      {rest.map((f) => {
        const value = content.fields[f.key] ?? "";
        return (
          <label key={f.key} className="block">
            <span className="label">
              {f.label} {f.optional && <span className="font-normal text-muted">(optional)</span>}
            </span>
            {f.kind === "textarea" ? (
              <textarea
                className="input min-h-36 leading-relaxed"
                value={value}
                onChange={(e) => setField(f.key, e.target.value)}
                maxLength={f.max}
                placeholder={f.placeholder}
              />
            ) : (
              <input className="input" value={value} onChange={(e) => setField(f.key, e.target.value)} maxLength={f.max} placeholder={f.placeholder} />
            )}
            <span className="mt-1 flex justify-between gap-4 text-xs text-muted">
              <span>{f.help}</span>
              <span className={value.length > f.max * 0.9 ? "text-rose" : ""}>
                {value.length}/{f.max}
              </span>
            </span>
          </label>
        );
      })}
      {design.photos.max > 0 && (
        <div>
          <span className="label">Photos</span>
          <PhotoPicker photos={content.photos} max={design.photos.max} label={design.photos.label} onChange={(photos) => onChange({ ...content, photos })} />
        </div>
      )}
    </div>
  );
}
