'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Music } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ id: number; name: string; artist: string; album: string; duration: number; syncedLyrics: string; instrumental?: boolean }>
  >([]);
  const [hasCantonese, setHasCantonese] = useState(true);
  const [noLyricsMessage, setNoLyricsMessage] = useState('');

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearchResults([]);

    try {
      const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      if (data.tracks.length === 0) {
        setError('未找到匹配的歌曲，试试换个关键词？');
        return;
      }

      setHasCantonese(data.hasCantonese !== false);
      setNoLyricsMessage(data.noLyrics ? data.message : '');
      setSearchResults(data.tracks);
    } catch {
      setError('搜索失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTrack = (track: {
    name: string;
    artist: string;
    syncedLyrics: string;
    instrumental?: boolean;
  }) => {
    if (!track.syncedLyrics || track.instrumental) {
      return;
    }
    const params = new URLSearchParams({
      song: track.name,
      artist: track.artist,
      lyrics: track.syncedLyrics,
    });
    router.push(`/result?${params.toString()}`);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-4 sm:px-6 py-8 sm:py-16">
      {/* 标题 */}
      <div className="w-full text-center mb-8 sm:mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary neon-red mb-3 sm:mb-4">
          粤瓷
        </h1>
        <p className="text-cream-muted text-base sm:text-lg">
          输入歌曲名，自动标注标准粤语发音
        </p>
      </div>

      {/* 搜索区域 */}
      <div className="w-full max-w-2xl flex-1">
        <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="输入歌曲名，如：十面埋伏、岁月如歌"
            className="flex-1 min-w-0 bg-white/[0.03] border border-primary/10 rounded-lg px-3 sm:px-4 py-2.5 sm:py-3
              text-cream placeholder-cream-muted/50 text-sm sm:text-base
              focus:outline-none focus:border-primary/40 transition-colors"
          />
          <button
            onClick={handleSearch}
            disabled={loading}
            className="btn-retro flex items-center gap-1.5 sm:gap-2 shrink-0 text-sm sm:text-base"
          >
            {loading ? (
              <span className="animate-spin">⏳</span>
            ) : (
              <Search size={16} className="sm:w-[18px] sm:h-[18px]" />
            )}
            搜索
          </button>
        </div>

        {/* 搜索结果 */}
        {searchResults.length > 0 && (
          <div className="space-y-2 sm:space-y-3">
            <p className="text-cream-muted text-xs sm:text-sm">
              找到 {searchResults.length} 个结果
              {!hasCantonese && (
                <span className="text-yellow-400/80 ml-1 sm:ml-2">（未找到粤语版本，以下为其他语言版本）</span>
              )}
              {noLyricsMessage && (
                <span className="text-yellow-400/80 ml-1 sm:ml-2">（{noLyricsMessage}）</span>
              )}
            </p>
            {searchResults.map((track) => (
              <button
                key={track.id}
                onClick={() => handleSelectTrack(track)}
                disabled={!track.syncedLyrics || track.instrumental}
                className={`w-full text-left p-3 sm:p-4 bg-white/[0.03] border border-white/[0.04]
                  rounded-lg sm:rounded-xl transition-all
                  ${!track.syncedLyrics || track.instrumental
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-white/[0.06] hover:border-primary/20 active:scale-[0.98] sm:hover:scale-[1.01]'
                  }`}
              >
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <Music size={18} className="text-primary flex-shrink-0 sm:w-5 sm:h-5" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-cream font-medium truncate text-sm sm:text-base">
                        {track.name}
                      </span>
                      {(!track.syncedLyrics || track.instrumental) && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.06] text-cream-muted shrink-0">
                          纯音乐
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-cream-muted text-xs sm:text-sm">
                      <span className="truncate">{track.artist}</span>
                      {track.album && (
                        <>
                          <span className="opacity-40 shrink-0">·</span>
                          <span className="truncate opacity-70">{track.album}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="mt-4 sm:mt-6 px-3 sm:px-4 py-2.5 sm:py-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm sm:text-base">
            {error}
          </div>
        )}
      </div>

      {/* 底部说明 - 始终在页面最底端 */}
      <div className="mt-auto pt-8 sm:pt-16 pb-4 sm:pb-8 text-center text-cream-muted text-xs sm:text-sm max-w-xl px-2">
        <p>
          数据来源：
          <span className="text-jade">LRCLIB</span>（歌词时间轴）+
          <span className="text-jade">翡翠粤语歌词</span>（权威粤拼标注）
        </p>
        <p className="mt-1.5 sm:mt-2 opacity-60">
          粤拼标注由翡翠粤语歌词(feitsui.com)提供，版权归原始作者所有
        </p>
      </div>
    </main>
  );
}
