"use client";

import React, { useMemo, useState } from "react";
import { Check, Pencil, X } from "lucide-react";

type Field =
  | { key: string; label: string; type: "text" | "number" }
  | { key: string; label: string; type: "datetime" }
  | { key: string; label: string; type: "textarea" };

export default function DetailsTable({
  fields,
  values,
  onChange,
}: {
  fields: Field[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const initialEditing = useMemo(() => Object.fromEntries(fields.map(f => [f.key, false])), [fields]);
  const [editing, setEditing] = useState<Record<string, boolean>>(initialEditing);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const startEdit = (key: string) => {
    setDraft((p) => ({ ...p, [key]: values[key] || "" }));
    setEditing((p) => ({ ...p, [key]: true }));
  };

  const cancelEdit = (key: string) => {
    setEditing((p) => ({ ...p, [key]: false }));
    setDraft((p) => ({ ...p, [key]: values[key] || "" }));
  };

  const commitEdit = (key: string) => {
    onChange(key, draft[key] ?? "");
    setEditing((p) => ({ ...p, [key]: false }));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid grid-cols-1 divide-y divide-border">
        {fields.map((f) => (
          <div key={f.key} className="grid grid-cols-[220px_1fr] items-start gap-4 px-4 py-4 sm:grid-cols-[260px_1fr]">
            <div>
              <div className="text-sm font-medium">{f.label}</div>
              <div className="text-xs text-muted-foreground">{f.key}</div>
            </div>
            <div className="flex flex-col gap-2 w-full">
              <div className="w-full">
                {editing[f.key] ? (
                  f.type === "textarea" ? (
                    <textarea
                      value={draft[f.key] ?? values[f.key] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                      rows={4}
                      className="w-full rounded-xl border border-border bg-background px-4 py-3 text-base min-h-[120px] focus:border-[var(--events-accent,theme(colors.indigo.600))] focus:outline-none"
                    />
                  ) : f.type === "datetime" ? (
                    <input
                      type="datetime-local"
                      value={draft[f.key] ?? values[f.key] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-border bg-background px-4 text-base focus:border-[var(--events-accent,theme(colors.indigo.600))] focus:outline-none"
                    />
                  ) : (
                    <input
                      type={f.type}
                      value={draft[f.key] ?? values[f.key] ?? ""}
                      onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                      className="w-full h-11 rounded-xl border border-border bg-background px-4 text-base focus:border-[var(--events-accent,theme(colors.indigo.600))] focus:outline-none"
                    />
                  )
                ) : (
                  <div className="min-h-[48px] rounded-xl border border-transparent bg-background px-4 py-3 text-base">
                    {values[f.key] || <span className="text-muted-foreground">—</span>}
                  </div>
                )}
              </div>
              <div className="mt-1 flex items-center gap-1 justify-end">
                {editing[f.key] ? (
                  <>
                    <button
                      aria-label="Save"
                      onClick={() => commitEdit(f.key)}
                      className="rounded-md border border-border p-2 text-emerald-600 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      aria-label="Cancel"
                      onClick={() => cancelEdit(f.key)}
                      className="rounded-md border border-border p-2 text-rose-600 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </>
                ) : (
                  <button
                    aria-label="Edit"
                    onClick={() => startEdit(f.key)}
                    className="rounded-md border border-border p-2 text-muted-foreground hover:bg-muted/50"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


