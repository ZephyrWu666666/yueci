import { NextRequest, NextResponse } from 'next/server';
import { parseLrc } from '@/lib/lrc-parser';
import { fetchFeitsuiJyutping } from '@/lib/feitsui-scraper';
import { alignLyrics } from '@/lib/lyrics-aligner';
import { generateLrc } from '@/lib/lrc-generator';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { syncedLyrics, songName, artistName } = body;

    if (!syncedLyrics) {
      return NextResponse.json({ error: '缺少歌词内容' }, { status: 400 });
    }

    // Step 1: 解析 LRC
    const lrcLines = parseLrc(syncedLyrics);
    if (lrcLines.length === 0) {
      return NextResponse.json({ error: '无法解析 LRC 格式' }, { status: 400 });
    }

    // Step 2: 尝试从翡翠歌词获取粤拼
    let feitsuiData = null;
    if (songName) {
      feitsuiData = await fetchFeitsuiJyutping(songName, artistName || '');
    }

    // Step 3: 对齐歌词与粤拼
    const alignedLines = await alignLyrics(lrcLines, feitsuiData);

    // Step 4: 生成 LRC
    const lrc = generateLrc(alignedLines, { songName, artistName });

    // 计算覆盖率
    const linesWithJyutping = alignedLines.filter((l) => l.jyutping).length;
    const coverage = alignedLines.length > 0
      ? linesWithJyutping / alignedLines.length
      : 0;

    return NextResponse.json({
      lrc,
      source: feitsuiData ? 'feitsui' : 'dict',
      coverage,
      alignedLines,
    });
  } catch (error) {
    console.error('粤拼标注失败:', error);
    return NextResponse.json(
      { error: '处理失败，请稍后重试' },
      { status: 500 }
    );
  }
}
