import { NextRequest, NextResponse } from 'next/server';
import { LrclibTrack, SearchResult } from '@/lib/types';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

const LRCLIB_BASE = 'https://lrclib.net/api';

// 粤语特征词：歌词中出现这些词基本可以判定为粤语歌
const CANTONESE_MARKERS = [
  '嘅', '咁', '啲', '冇', '唔', '嘢', '咗', '嗰', '佢', '哋',
  '嚟', '攰', '嬲', '叻', '揾', '搵', '畀', '俾', '噉', '嗱',
  '嘞', '咧', '喺', '噃', '啫', '嗮', '嘞', '囉', '嘛', '呢',
  '嘅话', '点解', '几时', '边个', '咁啱', '冇得', '唔使', '唔好',
  '系咁', '都系', '咁你', '我哋', '你哋', '佢哋', '呢个', '嗰个',
];

// 已知粤语歌手（简体 + 繁体 + 英文名）
const CANTONESE_ARTISTS = new Set([
  // 经典粤语歌手
  '陈奕迅', '陳奕迅', 'Eason Chan', 'Eason',
  '张国荣', '張國榮', 'Leslie Cheung',
  '谭咏麟', '譚詠麟', 'Alan Tam',
  '梅艳芳', '梅艷芳', 'Anita Mui',
  '张学友', '張學友', 'Jacky Cheung',
  '刘德华', '劉德華', 'Andy Lau',
  '黎明', '黎明', 'Leon Lai',
  '郭富城', '郭富城', 'Aaron Kwok',
  '林子祥', '林子祥', 'George Lam',
  '叶倩文', '葉倩文', 'Sally Yeh',
  '王菲', '王菲', 'Faye Wong',
  '容祖儿', '容祖兒', 'Joey Yung',
  '杨千嬅', '楊千嬅', 'Miriam Yeung',
  '古巨基', '古巨基', 'Leo Ku',
  '李克勤', '李克勤', 'Hacken Lee',
  '许志安', '許志安', 'Andy Hui',
  '郑秀文', '鄭秀文', 'Sammi Cheng',
  '谢安琪', '謝安琪', 'Kay Tse',
  '卫兰', '衛蘭', 'Janice Vidal',
  '方大同', '方大同', 'Khalil Fong',
  '周柏豪', '周柏豪', 'Pakho Chau',
  '林奕匡', '林奕匡', 'Phil Lam',
  '陈柏宇', '陳柏宇', 'Jason Chan',
  '邓紫棋', '鄧紫棋', 'G.E.M.',
  'AGA', 'Supper Moment',
  'C AllStar', 'RubberBand', 'Dear Jane',
  '张敬轩', '張敬軒', 'Hins Cheung',
  '侧田', '側田', 'Justin Lo',
  '吴雨霏', '吳雨霏', 'Kary Ng',
  '薛凯琪', '薛凱琪', 'Fiona Sit',
  '泳儿', '泳兒', 'Vincy Chan',
  '关心妍', '關心妍', 'Guan Xin Yan',
  '钟嘉欣', '鍾嘉欣', 'Linda Chung',
  '胡杏儿', '胡杏兒', 'Myolie Wu',
  '田蕊妮', '田蕊妮', 'Tian Ruini',
  '林峯', '林峯', 'Raymond Lam',
  '黄宗泽', '黃宗澤', 'Bosco Wong',
  '马浚伟', '馬浚偉', 'Steven Ma',
  '陈豪', '陳豪', 'Moses Chan',
  '郑伊健', '鄭伊健', 'Ekin Cheng',
  '苏永康', '蘇永康', 'William So',
  '梁汉文', '梁漢文', 'Edmond Leung',
  '梁咏琪', '梁詠琪', 'Gigi Leung',
  '莫文蔚', '莫文蔚', 'Karen Mok',
  '陈慧琳', '陳慧琳', 'Kelly Chen',
  'Twins',
  '周慧敏', '周慧敏', 'Vivian Chow',
  '关淑怡', '關淑怡', 'Shirley Kwan',
  '林忆莲', '林憶蓮', 'Sandy Lam',
  '刘小慧', '劉小慧',
  '彭羚', '彭羚',
  '李蕙敏', '李蕙敏',
  '郑中基', '鄭中基', 'Ronald Cheng',
  '陈小春', '陳小春', 'Jordan Chan',
  '余文乐', '余文樂', 'Shawn Yue',
  '麦浚龙', '麥浚龍', 'Juno Mak',
  '洪卓立', '洪卓立', 'Hung Cheuk Lap',
  '钟舒漫', '鍾舒漫', 'Sherman Chung',
  '吴若希', '吳若希', 'Jinny Ng',
  '许廷铿', '許廷鏗', 'Hui Ting Hung',
  '胡鸿钧', '胡鴻鈞', 'Hubert Wu',
  '林欣彤', '林欣彤', 'Mag Lam',
  '罗力威', '羅力威',
  '叶巧琳', '葉巧琳',
  '曾比特', '曾比特',
  '炎明熹', '炎明熹', 'Gigi Yim',
  '姚焯菲', '姚焯菲', 'Chantel Yiu',
  '钟柔美', '鍾柔美', 'Yumi Chung',
  '詹天文', '詹天文',
  '吕爵安', '呂爵安', 'Edan Lui',
  '卢瀚霆', '盧瀚霆', 'Anson Lo',
  '姜涛', '姜濤', 'Keung To',
  '柳应廷', '柳應廷', 'Jeremy Lau',
  '江𤒹生', '江𤒹生', 'Anson Kong',
  '陈卓贤', '陳卓賢', 'Ian Chan',
  '张天赋', '張天賦', 'MC Cheung',
  '林家谦', '林家謙', 'Terence Lam',
  '陈蕾', '陳蕾', 'Pan Chan',
  'Serrini', 'per se', 'Kiri T',
]);

function isCantoneseLyrics(lyrics: string): boolean {
  let count = 0;
  for (const marker of CANTONESE_MARKERS) {
    if (lyrics.includes(marker)) {
      count++;
      if (count >= 2) return true;
    }
  }
  return false;
}

function isCantoneseArtist(artistName: string): boolean {
  return CANTONESE_ARTISTS.has(artistName);
}

async function fetchWithRetry(url: string, retries = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'CantoLyricsJyutping/1.0 (https://github.com/canto-lyrics)',
        },
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) return res;
      if (i === retries) return res;
    } catch (err) {
      if (i === retries) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
  throw new Error('fetch failed');
}

function deduplicateTracks(tracks: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    const key = `${t.name.toLowerCase()}|${t.artist.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query');

  if (!query) {
    return NextResponse.json({ error: '缺少搜索关键词' }, { status: 400 });
  }

  try {
    const trimmed = query.trim();
    let trackName = trimmed;

    if (trimmed.includes(' - ')) {
      trackName = trimmed.split(' - ').slice(1).join(' - ').trim();
    } else {
      const parts = trimmed.split(/\s+/);
      if (parts.length >= 2 && parts[0].length <= 4) {
        trackName = parts.slice(1).join(' ');
      }
    }

    const url = new URL(`${LRCLIB_BASE}/search`);
    url.searchParams.set('track_name', trackName);

    const response = await fetchWithRetry(url.toString());

    if (!response.ok) {
      throw new Error(`LRCLIB 返回 ${response.status}`);
    }

    const data: LrclibTrack[] = await response.json();

    // 过滤有同步歌词的曲目
    const tracksWithLyrics = deduplicateTracks(
      data
        .filter((t) => t.syncedLyrics && !t.instrumental)
        .map((t) => ({
          id: t.id,
          name: t.trackName,
          artist: t.artistName,
          album: t.albumName,
          duration: t.duration,
          hasLrc: true,
          syncedLyrics: t.syncedLyrics!,
        }))
    );

    // 优先返回粤语版本（歌词特征词 OR 已知粤语歌手）
    const cantonese = tracksWithLyrics.filter(
      (t) => isCantoneseLyrics(t.syncedLyrics) || isCantoneseArtist(t.artist)
    );

    // 如果有粤语版本，只返回粤语；否则返回全部（让用户知道没找到粤语版）
    const tracks = cantonese.length > 0 ? cantonese : tracksWithLyrics;

    // 如果完全没有有歌词的版本，返回所有结果（包括 instrumental）
    if (tracks.length === 0 && data.length > 0) {
      const allTracks = deduplicateTracks(
        data.map((t) => ({
          id: t.id,
          name: t.trackName,
          artist: t.artistName,
          album: t.albumName,
          duration: t.duration,
          hasLrc: !!t.syncedLyrics,
          syncedLyrics: t.syncedLyrics || '',
          instrumental: t.instrumental,
        }))
      );
      return NextResponse.json({
        tracks: allTracks,
        hasCantonese: false,
        noLyrics: true,
        message: '该歌曲在数据库中被标记为纯音乐，暂无歌词',
      });
    }

    return NextResponse.json({ tracks, hasCantonese: cantonese.length > 0 });
  } catch (error) {
    console.error('搜索失败:', error);
    return NextResponse.json(
      { error: '搜索失败，请稍后重试', tracks: [] },
      { status: 500 }
    );
  }
}
