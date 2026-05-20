import { FeitsuiLine } from './types';

const FEITSUI_BASE = 'https://www.feitsui.com';
const USER_AGENT = 'CantoLyricsJyutping/1.0 (educational use)';

/**
 * 在翡翠歌词网站搜索歌曲并获取粤拼数据
 */
export async function fetchFeitsuiJyutping(
  songName: string,
  artistName: string
): Promise<{ lines: FeitsuiLine[]; songUrl: string } | null> {
  try {
    // Step 1: 搜索歌曲
    const searchUrl = `${FEITSUI_BASE}/zh-hans/search?q=${encodeURIComponent(songName)}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!searchRes.ok) return null;

    const searchHtml = await searchRes.text();

    // Step 2: 从搜索结果中找到匹配的歌词页链接
    const lyricUrl = findLyricUrl(searchHtml, songName, artistName);
    if (!lyricUrl) return null;

    // Step 3: 获取歌词页内容
    const lyricRes = await fetch(lyricUrl, {
      headers: { 'User-Agent': USER_AGENT },
    });

    if (!lyricRes.ok) return null;

    const lyricHtml = await lyricRes.text();

    // Step 4: 解析粤拼数据
    const lines = parseFeitsuiHtml(lyricHtml);
    if (lines.length === 0) return null;

    return { lines, songUrl: lyricUrl };
  } catch (error) {
    console.error('翡翠歌词爬取失败:', error);
    return null;
  }
}

/**
 * 从搜索结果 HTML 中找到歌词页 URL
 */
function findLyricUrl(
  html: string,
  songName: string,
  _artistName: string
): string | null {
  // 匹配歌词链接: /zh-hans/lyrics/数字
  const linkRegex = /href="(\/zh-hans\/lyrics\/\d+)"/g;
  const titleRegex = /<a[^>]*href="(\/zh-hans\/lyrics\/\d+)"[^>]*>([^<]+)<\/a>/g;

  // 先尝试精确匹配歌手+歌名
  const matches: Array<{ url: string; title: string }> = [];
  let match;
  while ((match = titleRegex.exec(html)) !== null) {
    matches.push({ url: match[1], title: match[2].trim() });
  }

  // 优先匹配歌名
  const found = matches.find(
    (m) =>
      m.title.includes(songName) ||
      songName.includes(m.title)
  );

  if (found) {
    return `${FEITSUI_BASE}${found.url}`;
  }

  // 如果只有一个结果，直接用
  if (matches.length === 1) {
    return `${FEITSUI_BASE}${matches[0].url}`;
  }

  // 兜底：返回第一个链接
  const firstLink = linkRegex.exec(html);
  return firstLink ? `${FEITSUI_BASE}${firstLink[1]}` : null;
}

/**
 * 解析翡翠歌词 HTML，提取每行的汉字+粤拼
 */
function parseFeitsuiHtml(html: string): FeitsuiLine[] {
  const lines: FeitsuiLine[] = [];

  // 提取所有文本行
  const textBlockRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  const allTextLines: string[] = [];

  let match;
  while ((match = textBlockRegex.exec(html)) !== null) {
    // 清理 HTML 标签
    const cleaned = match[1]
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .trim();

    if (cleaned) {
      cleaned.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed) allTextLines.push(trimmed);
      });
    }
  }

  // 如果 p 标签没找到，尝试从纯文本中提取
  if (allTextLines.length === 0) {
    const plainText = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');

    plainText.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && trimmed.length > 1) {
        allTextLines.push(trimmed);
      }
    });
  }

  // 配对：识别哪些行是粤拼（包含拉丁字母+数字声调）
  const jyutpingPattern = /^[a-zA-Z]+\d.*$/;
  const chinesePattern = /[一-鿿]/;

  for (let i = 0; i < allTextLines.length; i++) {
    const currentLine = allTextLines[i];
    const nextLine = allTextLines[i + 1];

    // 如果当前行是汉字，下一行是粤拼
    if (
      chinesePattern.test(currentLine) &&
      nextLine &&
      jyutpingPattern.test(nextLine.replace(/\s+/g, ''))
    ) {
      const chars = extractChars(currentLine);
      const pinyins = extractPinyins(nextLine);

      if (chars.length > 0 && pinyins.length > 0) {
        lines.push({
          original: currentLine,
          jyutping: nextLine,
          chars,
          pinyins,
        });
      }
      i++; // 跳过粤拼行
    }
    // 如果当前行混合了汉字和拼音（如 "愛oi3 上soeng5"）
    else if (chinesePattern.test(currentLine) && /[a-z]\d/.test(currentLine)) {
      const parsed = parseMixedLine(currentLine);
      if (parsed.chars.length > 0) {
        lines.push({
          original: currentLine,
          jyutping: parsed.pinyins.join(' '),
          chars: parsed.chars,
          pinyins: parsed.pinyins,
        });
      }
    }
    // 纯汉字行（没有对应的粤拼）
    else if (chinesePattern.test(currentLine) && !nextLine?.match(jyutpingPattern)) {
      const chars = extractChars(currentLine);
      if (chars.length > 0) {
        lines.push({
          original: currentLine,
          jyutping: '',
          chars,
          pinyins: [],
        });
      }
    }
  }

  return lines;
}

/**
 * 从文本中提取汉字数组
 */
function extractChars(text: string): string[] {
  const chars: string[] = [];
  for (const char of text) {
    if (/[一-鿿]/.test(char)) {
      chars.push(char);
    }
  }
  return chars;
}

/**
 * 从粤拼音行提取拼音数组
 */
function extractPinyins(text: string): string[] {
  const matches = text.match(/[a-zA-Z]+\d/g);
  if (!matches) return [];
  return matches.map((p) => {
    const parts = p.split('/');
    return parts[0];
  });
}

/**
 * 解析混合行（汉字和拼音混在一起，如 "愛oi3 上soeng5"）
 */
function parseMixedLine(text: string): { chars: string[]; pinyins: string[] } {
  const chars: string[] = [];
  const pinyins: string[] = [];

  const regex = /([一-鿿]+)([a-zA-Z]+(?:\/[a-zA-Z]+)*\d)/g;
  let match;

  while ((match = regex.exec(text)) !== null) {
    const charPart = match[1];
    const pinyinPart = match[2];

    for (const char of charPart) {
      chars.push(char);
    }

    const mainPinyin = pinyinPart.split('/')[0];
    for (let i = 0; i < charPart.length; i++) {
      pinyins.push(mainPinyin);
    }
  }

  return { chars, pinyins };
}
