/**
 * 构建粤拼字典
 *
 * 使用方法：
 * 1. 克隆 rime-cantonese: git clone https://github.com/rime/rime-cantonese.git /tmp/rime-cantonese
 * 2. 运行: npx tsx scripts/build-jyutping-dict.ts
 * 3. 输出: public/data/jyutping-dict.json
 */

import * as fs from 'fs';
import * as path from 'path';

const RIME_DICT_PATH = '/tmp/rime-cantonese/jyut6ping3.chars.dict.yaml';
const OUTPUT_PATH = path.join(process.cwd(), 'public', 'data', 'jyutping-dict.json');

interface DictEntry {
  char: string;
  jyutping: string;
  frequency: number;
}

function parseRimeDict(filePath: string): DictEntry[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const entries: DictEntry[] = [];

  // 跳过 YAML 头部
  let inBody = false;
  for (const line of lines) {
    if (line === '...') {
      inBody = true;
      continue;
    }
    if (!inBody) continue;
    if (line.startsWith('#') || line.trim() === '') continue;

    // 格式: 字\t粤拼\t频率
    const parts = line.split('\t');
    if (parts.length >= 2) {
      const char = parts[0].trim();
      const jyutping = parts[1].trim();
      const frequency = parts.length >= 3 ? parseInt(parts[2]) || 0 : 0;

      // 只保留单字条目
      if (char.length === 1 && /^[a-z]+\d$/.test(jyutping)) {
        entries.push({ char, jyutping, frequency });
      }
    }
  }

  return entries;
}

function buildDict(entries: DictEntry[]): Record<string, string[]> {
  const dict: Record<string, { jyutping: string; freq: number }[]> = {};

  for (const entry of entries) {
    if (!dict[entry.char]) {
      dict[entry.char] = [];
    }
    // 去重
    if (!dict[entry.char].some((d) => d.jyutping === entry.jyutping)) {
      dict[entry.char].push({ jyutping: entry.jyutping, freq: entry.frequency });
    }
  }

  // 按频率排序，只保留粤拼数组
  const result: Record<string, string[]> = {};
  for (const [char, readings] of Object.entries(dict)) {
    readings.sort((a, b) => b.freq - a.freq);
    result[char] = readings.map((r) => r.jyutping);
  }

  return result;
}

// 执行
if (fs.existsSync(RIME_DICT_PATH)) {
  console.log('正在解析 rime-cantonese 字典...');
  const entries = parseRimeDict(RIME_DICT_PATH);
  console.log(`解析到 ${entries.length} 条目`);

  const dict = buildDict(entries);
  const charCount = Object.keys(dict).length;
  console.log(`构建字典：${charCount} 个汉字`);

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dict), 'utf-8');
  console.log(`字典已写入: ${OUTPUT_PATH}`);
} else {
  console.log(`未找到 rime-cantonese 字典文件: ${RIME_DICT_PATH}`);
  console.log('请先克隆: git clone https://github.com/rime/rime-cantonese.git /tmp/rime-cantonese');
  console.log('将使用内置精简字典作为兜底');
}
