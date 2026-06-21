function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function inlineMarkdown(text: string): string {
  return text
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2" />')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener">$1</a>')
    .replace(/`([^`]+)`/g, '<code class="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/__([\s\S]+?)__/g, "<strong>$1</strong>")
    .replace(/_([^_]+)_/g, "<em>$1</em>");
}

export function renderMarkdown(src: string): string {
  const lines = src.split("\n");
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        codeLines.push(escapeHtml(lines[i]));
        i++;
      }
      output.push(
        `<pre class="bg-slate-900 text-slate-100 rounded-xl p-4 overflow-x-auto my-4 text-sm font-mono"><code${lang ? ` class="language-${lang}"` : ""}>${codeLines.join("\n")}</code></pre>`
      );
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)/);
    if (h) {
      const level = h[1].length;
      const text = inlineMarkdown(h[2]);
      const sizes = ["", "text-2xl font-bold mt-8 mb-3", "text-xl font-bold mt-6 mb-2", "text-lg font-semibold mt-5 mb-2", "text-base font-semibold mt-4 mb-1", "text-sm font-semibold mt-3 mb-1", "text-sm font-medium mt-2 mb-1"];
      const id = h[2].toLowerCase().replace(/[^a-z0-9]+/g, "-");
      output.push(`<h${level} id="${id}" class="${sizes[level]} text-slate-900 scroll-mt-20">${text}</h${level}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      output.push('<hr class="border-slate-200 my-6" />');
      i++;
      continue;
    }

    // Blockquote
    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ""));
        i++;
      }
      output.push(`<blockquote class="border-l-4 border-blue-300 pl-4 my-4 text-slate-600 italic bg-blue-50 py-2 rounded-r-lg">${inlineMarkdown(quoteLines.join("\n"))}</blockquote>`);
      continue;
    }

    // Unordered list
    if (/^[-*+]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        items.push(`<li class="ml-2">${inlineMarkdown(lines[i].replace(/^[-*+]\s/, ""))}</li>`);
        i++;
      }
      output.push(`<ul class="list-disc list-inside my-3 space-y-1 text-slate-700">${items.join("")}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(`<li class="ml-2">${inlineMarkdown(lines[i].replace(/^\d+\.\s/, ""))}</li>`);
        i++;
      }
      output.push(`<ol class="list-decimal list-inside my-3 space-y-1 text-slate-700">${items.join("")}</ol>`);
      continue;
    }

    // Checkbox task list
    if (/^[-*]\s\[[ xX]\]/.test(line)) {
      const checked = /\[[xX]\]/.test(line);
      const text = inlineMarkdown(line.replace(/^[-*]\s\[[ xX]\]\s?/, ""));
      output.push(`<div class="flex items-center gap-2 my-1"><input type="checkbox" ${checked ? "checked" : ""} disabled class="rounded" /><span class="text-slate-700 ${checked ? "line-through text-slate-400" : ""}">${text}</span></div>`);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph — collect until blank line
    const paraLines: string[] = [];
    while (i < lines.length && lines[i].trim() !== "" && !/^(#|```|>|[-*+]\s|\d+\.|---|\*\*\*|___)/.test(lines[i])) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length) {
      output.push(`<p class="my-3 text-slate-700 leading-relaxed">${inlineMarkdown(paraLines.join(" "))}</p>`);
    }
  }

  return output.join("\n");
}
