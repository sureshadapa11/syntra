"use client";

import { useState, useRef, useCallback } from "react";
import { renderMarkdown } from "@/lib/markdown";
import {
  Bold, Italic, Code, Link, List, ListOrdered, Quote, Minus,
  Heading1, Heading2, Heading3, Eye, Edit3, Image,
} from "lucide-react";

interface WikiEditorProps {
  value: string;
  onChange: (v: string) => void;
}

export function WikiEditor({ value, onChange }: WikiEditorProps) {
  const [mode, setMode] = useState<"write" | "preview" | "split">("write");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insert(before: string, after = "", placeholder = "text") {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end) || placeholder;
    const newVal = value.slice(0, start) + before + selected + after + value.slice(end);
    onChange(newVal);
    setTimeout(() => {
      ta.focus();
      const cursor = start + before.length + selected.length + after.length;
      ta.setSelectionRange(cursor, cursor);
    }, 0);
  }

  function insertLine(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const before = value.slice(0, lineStart);
    const after = value.slice(lineStart);
    onChange(before + prefix + after);
    setTimeout(() => {
      ta.focus();
      const pos = lineStart + prefix.length;
      ta.setSelectionRange(pos, pos);
    }, 0);
  }

  const handleTab = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      insert("  ", "", "");
    }
  }, [value]);

  const TOOLBAR: Array<{ icon: React.ElementType; title: string; action: () => void } | "sep"> = [
    { icon: Bold, title: "Bold", action: () => insert("**", "**", "bold text") },
    { icon: Italic, title: "Italic", action: () => insert("*", "*", "italic text") },
    { icon: Code, title: "Inline Code", action: () => insert("`", "`", "code") },
    "sep",
    { icon: Heading1, title: "Heading 1", action: () => insertLine("# ") },
    { icon: Heading2, title: "Heading 2", action: () => insertLine("## ") },
    { icon: Heading3, title: "Heading 3", action: () => insertLine("### ") },
    "sep",
    { icon: List, title: "Bullet List", action: () => insertLine("- ") },
    { icon: ListOrdered, title: "Ordered List", action: () => insertLine("1. ") },
    { icon: Quote, title: "Blockquote", action: () => insertLine("> ") },
    { icon: Minus, title: "Horizontal Rule", action: () => { onChange(value + "\n\n---\n\n"); } },
    "sep",
    { icon: Link, title: "Link", action: () => insert("[", "](url)", "link text") },
    { icon: Image, title: "Image", action: () => insert("![", "](url)", "alt text") },
  ];

  return (
    <div className="flex flex-col h-full border border-slate-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50 flex-wrap">
        {TOOLBAR.map((item, i) =>
          item === "sep" ? (
            <div key={i} className="w-px h-4 bg-slate-200 mx-1" />
          ) : (
            <button
              key={item.title}
              title={item.title}
              onClick={item.action}
              type="button"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              <item.icon size={13} />
            </button>
          )
        )}

        {/* Mode toggle */}
        <div className="ml-auto flex border border-slate-200 rounded-lg overflow-hidden">
          {(["write", "split", "preview"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`px-2.5 py-1 text-xs font-medium transition-colors ${
                mode === m ? "bg-slate-700 text-white" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {m === "write" ? <Edit3 size={12} /> : m === "preview" ? <Eye size={12} /> : (
                <span className="flex items-center gap-0.5"><Edit3 size={11} /><span>/</span><Eye size={11} /></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Editor / Preview area */}
      <div className={`flex flex-1 min-h-0 ${mode === "split" ? "divide-x divide-slate-100" : ""}`}>
        {/* Write pane */}
        {(mode === "write" || mode === "split") && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleTab}
            spellCheck
            placeholder="Start writing… Markdown is supported"
            className={`flex-1 p-4 text-sm font-mono text-slate-800 resize-none focus:outline-none bg-white leading-relaxed placeholder:text-slate-300 ${
              mode === "split" ? "w-1/2" : "w-full"
            }`}
          />
        )}

        {/* Preview pane */}
        {(mode === "preview" || mode === "split") && (
          <div
            className={`flex-1 p-5 overflow-y-auto bg-white prose-wiki ${mode === "split" ? "w-1/2" : "w-full"}`}
            dangerouslySetInnerHTML={{ __html: value.trim() ? renderMarkdown(value) : '<p class="text-slate-300 italic">Nothing to preview yet…</p>' }}
          />
        )}
      </div>

      {/* Word count */}
      <div className="px-4 py-1.5 border-t border-slate-100 bg-slate-50 text-right">
        <span className="text-xs text-slate-400">
          {value.trim().split(/\s+/).filter(Boolean).length} words · {value.length} chars
        </span>
      </div>
    </div>
  );
}
