import { LrcLine, FeitsuiLine, AlignedLine } from './types';
import { cleanText } from './lrc-parser';
import { lookupLine } from './jyutping-dict';

/**
 * 将 LRC 歌词行与翡翠歌词粤拼数据对齐
 */
export async function alignLyrics(
  lrcLines: LrcLine[],
  feitsuiData: { lines: FeitsuiLine[] } | null
): Promise<AlignedLine[]> {
  const result: AlignedLine[] = [];

  for (const lrcLine of lrcLines) {
    let jyutping = '';

    if (feitsuiData && feitsuiData.lines.length > 0) {
      const bestMatch = findBestMatch(lrcLine.text, feitsuiData.lines);
      if (bestMatch && bestMatch.score > 0.6) {
        jyutping = bestMatch.line.pinyins.join(' ');
      }
    }

    if (!jyutping) {
      const chars = extractCharsFromString(lrcLine.text);
      if (chars.length > 0) {
        jyutping = await lookupLine(chars);
      }
    }

    result.push({
      time: lrcLine.time,
      text: lrcLine.text,
      jyutping,
    });
  }

  return result;
}

/**
 * 在翡翠歌词行中找到最佳匹配
 */
function findBestMatch(
  lrcText: string,
  feitsuiLines: FeitsuiLine[]
): { line: FeitsuiLine; score: number } | null {
  const cleanedLrc = cleanText(lrcText);
  let bestMatch: { line: FeitsuiLine; score: number } | null = null;

  for (const fLine of feitsuiLines) {
    const cleanedFeitsui = cleanText(fLine.original);
    const score = similarity(cleanedLrc, cleanedFeitsui);

    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { line: fLine, score };
    }
  }

  return bestMatch;
}

/**
 * 计算两个字符串的相似度（0-1）
 */
function similarity(a: string, b: string): number {
  if (a.length === 0 || b.length === 0) return 0;
  if (a === b) return 1;

  const lcsLen = lcs(a, b);
  return (2 * lcsLen) / (a.length + b.length);
}

/**
 * 最长公共子序列长度
 */
function lcs(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    Array(n + 1).fill(0)
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}

/**
 * 从字符串中提取汉字数组
 */
function extractCharsFromString(text: string): string[] {
  const chars: string[] = [];
  for (const char of text) {
    if (/[一-鿿]/.test(char)) {
      chars.push(char);
    }
  }
  return chars;
}
