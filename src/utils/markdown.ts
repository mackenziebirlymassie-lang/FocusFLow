function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatInline(text: string): string {
  let res = escapeHtml(text);
  // Code span `code`
  res = res.replace(/`([^`]+)`/g, '<code class="bg-zinc-800 text-blue-300 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');
  // Bold **text**
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-zinc-100">$1</strong>');
  // Italic *text*
  res = res.replace(/\*([^*]+)\*/g, '<em class="italic text-zinc-300">$1</em>');
  // Links [text](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer" class="text-blue-400 underline hover:text-blue-300">$1</a>');
  return res;
}

export function parseMarkdown(markdown: string): string {
  if (!markdown) return '<p class="text-zinc-500 italic text-sm">No notes entered yet.</p>';

  const lines = markdown.split('\n');
  const htmlOut: string[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let checkboxCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];

    // Fenced code blocks
    if (rawLine.trim().startsWith('```')) {
      if (inCodeBlock) {
        htmlOut.push(
          `<pre class="bg-zinc-900 border border-zinc-800 p-3 rounded-lg overflow-x-auto font-mono text-xs text-zinc-200 my-2"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(rawLine);
      continue;
    }

    const trimmed = rawLine.trim();

    // Empty lines
    if (!trimmed) {
      htmlOut.push('<div class="h-2"></div>');
      continue;
    }

    // Dividers
    if (trimmed === '---' || trimmed === '***') {
      htmlOut.push('<hr class="border-zinc-800 my-3" />');
      continue;
    }

    // Headers
    if (trimmed.startsWith('### ')) {
      htmlOut.push(`<h3 class="text-base font-semibold text-zinc-100 mt-3 mb-1">${formatInline(trimmed.slice(4))}</h3>`);
      continue;
    }
    if (trimmed.startsWith('## ')) {
      htmlOut.push(`<h2 class="text-lg font-bold text-zinc-100 mt-4 mb-1.5">${formatInline(trimmed.slice(3))}</h2>`);
      continue;
    }
    if (trimmed.startsWith('# ')) {
      htmlOut.push(`<h1 class="text-xl font-extrabold text-zinc-100 mt-4 mb-2">${formatInline(trimmed.slice(2))}</h1>`);
      continue;
    }

    // Checkboxes
    const uncheckedMatch = trimmed.match(/^[-*]\s*\[\s*\]\s*(.*)$/);
    if (uncheckedMatch) {
      const idx = checkboxCounter++;
      htmlOut.push(
        `<div class="flex items-start gap-2.5 my-1 text-sm text-zinc-300">
          <button type="button" data-check-idx="${idx}" class="mt-0.5 w-4 h-4 rounded border border-zinc-600 hover:border-blue-400 bg-zinc-900 flex items-center justify-center transition-colors cursor-pointer flex-shrink-0" title="Mark done"></button>
          <span>${formatInline(uncheckedMatch[1])}</span>
        </div>`
      );
      continue;
    }

    const checkedMatch = trimmed.match(/^[-*]\s*\[[xX]\]\s*(.*)$/);
    if (checkedMatch) {
      const idx = checkboxCounter++;
      htmlOut.push(
        `<div class="flex items-start gap-2.5 my-1 text-sm text-zinc-400">
          <button type="button" data-check-idx="${idx}" class="mt-0.5 w-4 h-4 rounded bg-blue-600 border border-blue-500 flex items-center justify-center text-white text-[10px] cursor-pointer flex-shrink-0" title="Mark undone">✓</button>
          <span class="line-through text-zinc-500">${formatInline(checkedMatch[1])}</span>
        </div>`
      );
      continue;
    }

    // Bullet lists
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      htmlOut.push(`<li class="list-disc ml-4 my-0.5 text-sm text-zinc-300">${formatInline(trimmed.slice(2))}</li>`);
      continue;
    }

    // Regular paragraph
    htmlOut.push(`<p class="text-sm text-zinc-300 my-1 leading-relaxed">${formatInline(trimmed)}</p>`);
  }

  if (inCodeBlock && codeBuffer.length > 0) {
    htmlOut.push(
      `<pre class="bg-zinc-900 border border-zinc-800 p-3 rounded-lg overflow-x-auto font-mono text-xs text-zinc-200 my-2"><code>${escapeHtml(codeBuffer.join('\n'))}</code></pre>`
    );
  }

  return htmlOut.join('');
}

/**
 * Toggles the N-th interactive markdown checkbox between [ ] and [x].
 */
export function toggleMarkdownCheckbox(markdown: string, targetIndex: number): string {
  let currentIndex = 0;
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const unchecked = line.match(/^(\s*[-*]\s*\[)\s*(\]\s*.*)$/);
    if (unchecked) {
      if (currentIndex === targetIndex) {
        lines[i] = `${unchecked[1]}x${unchecked[2]}`;
        return lines.join('\n');
      }
      currentIndex++;
      continue;
    }

    const checked = line.match(/^(\s*[-*]\s*\[)[xX](\]\s*.*)$/);
    if (checked) {
      if (currentIndex === targetIndex) {
        lines[i] = `${checked[1]} ${checked[2]}`;
        return lines.join('\n');
      }
      currentIndex++;
      continue;
    }
  }

  return markdown;
}
