import { AlignedLine } from './types';

/**
 * 生成带粤拼的 LRC 文件内容
 */
export function generateLrc(
  alignedLines: AlignedLine[],
  metadata?: { songName?: string; artistName?: string }
): string {
  const header: string[] = [];

  if (metadata?.artistName) {
    header.push(`[ar:${metadata.artistName}]`);
  }
  if (metadata?.songName) {
    header.push(`[ti:${metadata.songName}]`);
  }
  header.push('[by:CantoLyricsJyutping]');
  header.push('');

  const body: string[] = [];

  for (const line of alignedLines) {
    body.push(`${line.time}${line.text}`);
    if (line.jyutping) {
      body.push(`${line.time}${line.jyutping}`);
    }
  }

  return [...header, ...body].join('\n');
}

/**
 * 触发浏览器下载 LRC 文件
 */
export function downloadLrc(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.lrc') ? filename : `${filename}.lrc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
