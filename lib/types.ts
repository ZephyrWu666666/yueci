// LRCLIB API 返回的歌曲信息
export interface LrclibTrack {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
}

// 搜索结果
export interface SearchResult {
  id: number;
  name: string;
  artist: string;
  album: string;
  duration: number;
  hasLrc: boolean;
  syncedLyrics: string;
  instrumental?: boolean;
}

// LRC 解析后的单行
export interface LrcLine {
  time: string;    // "[00:12.34]"
  timeMs: number;  // 12340
  text: string;    // "愛上了 看見你"
}

// 翡翠歌词的单行数据
export interface FeitsuiLine {
  original: string;  // 原始汉字行
  jyutping: string;  // 粤拼行
  chars: string[];   // 拆分后的汉字数组
  pinyins: string[]; // 拆分后的粤拼数组
}

// 对齐后的歌词行（最终输出）
export interface AlignedLine {
  time: string;
  text: string;
  jyutping: string;
}

// API 响应：搜索
export interface SearchResponse {
  tracks: SearchResult[];
}

// API 响应：粤拼标注
export interface JyutpingResponse {
  lrc: string;
  source: 'feitsui' | 'dict';
  coverage: number;
  alignedLines: AlignedLine[];
}
