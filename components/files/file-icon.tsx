import {
  FileText, Image, Film, Music, Archive, Code, Table, File,
  FileImage, Presentation,
} from "lucide-react";

const MIME_MAP: Array<[RegExp, React.ElementType, string]> = [
  [/^image\//, FileImage, "text-green-500"],
  [/^video\//, Film, "text-purple-500"],
  [/^audio\//, Music, "text-pink-500"],
  [/\/(zip|x-zip|x-rar|x-tar|gzip|7z)/, Archive, "text-yellow-600"],
  [/\/(pdf)/, FileText, "text-red-500"],
  [/\/(javascript|typescript|json|html|css|xml|x-python|x-java|x-c|x-cpp|x-ruby|x-go|x-rust|x-sh)/, Code, "text-blue-500"],
  [/\/(csv|spreadsheet|excel|xlsx|xls)/, Table, "text-green-600"],
  [/\/(presentation|powerpoint|pptx|ppt)/, Presentation, "text-orange-500"],
  [/\/(msword|document|docx|doc)/, FileText, "text-blue-600"],
];

export function FileIcon({ mimeType, size = 20 }: { mimeType: string; size?: number }) {
  for (const [pattern, Icon, color] of MIME_MAP) {
    if (pattern.test(mimeType)) return <Icon size={size} className={color} />;
  }
  return <File size={size} className="text-slate-400" />;
}

export function mimeLabel(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "Image";
  if (mimeType.startsWith("video/")) return "Video";
  if (mimeType.startsWith("audio/")) return "Audio";
  if (mimeType.includes("pdf")) return "PDF";
  if (mimeType.includes("spreadsheet") || mimeType.includes("csv") || mimeType.includes("excel")) return "Spreadsheet";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "Presentation";
  if (mimeType.includes("word") || mimeType.includes("document")) return "Document";
  if (mimeType.includes("zip") || mimeType.includes("rar") || mimeType.includes("tar")) return "Archive";
  if (mimeType.includes("json")) return "JSON";
  if (mimeType.includes("javascript") || mimeType.includes("typescript")) return "Code";
  return mimeType.split("/")[1]?.toUpperCase() ?? "File";
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
