import { LrcLine } from './types';

/**
 * 解析 LRC 格式歌词为结构化数据
 */
export function parseLrc(lrcText: string): LrcLine[] {
  const lines = lrcText.split('\n');
  const result: LrcLine[] = [];

  for (const line of lines) {
    const match = line.match(/^\[(\d{2}:\d{2}\.\d{2,3})\]\s*(.*)$/);
    if (match) {
      const timeStr = match[1];
      const text = match[2].trim();
      if (text) {
        result.push({
          time: `[${timeStr}]`,
          timeMs: timeToMs(timeStr),
          text,
        });
      }
    }
  }

  return result;
}

/**
 * 将 "mm:ss.xx" 转换为毫秒
 */
function timeToMs(time: string): number {
  const [minSec, ms] = time.split('.');
  const [min, sec] = minSec.split(':').map(Number);
  return min * 60000 + sec * 1000 + parseInt(ms.padEnd(3, '0'));
}

/**
 * 清洗歌词文本（去除标点、空格，用于对齐比较）
 */
export function cleanText(text: string): string {
  return text
    .replace(/[\s　]/g, '')
    .replace(/[，。！？、；：""''「」『』（）《》\-—…·,\.!\?;:'"()\[\]{}]/g, '')
    .toLowerCase();
}
