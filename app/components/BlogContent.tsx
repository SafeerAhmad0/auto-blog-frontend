"use client";
import { useEffect, useRef } from "react";

interface Props {
  content: string;
}

function parseMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^\> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^\* (.+)$/gm, "<li>$1</li>")
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[h|u|o|l|b|p|h])(.+)$/gm, (line) => {
      if (line.trim() === "" || line.startsWith("<")) return line;
      return line;
    })
    .replace(/^([^<\n].+)$/gm, (line) => {
      if (!line.trim()) return "";
      if (/^<[a-z]/.test(line)) return line;
      return `<p>${line}</p>`;
    });
}

export default function BlogContent({ content }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.innerHTML = parseMarkdown(content);
    }
  }, [content]);

  return <div ref={ref} className="blog-content" />;
}
