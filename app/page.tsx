'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FileText, Upload, Music } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [lyrics, setLyrics] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{ id: number; name: string; artist: string; album: string; duration: number; syncedLyrics: string }>
  >([]);
  const [mode, setMode] = useState<'search' | 'paste'>('search');
  const [hasCantonese, setHasCantonese] = useState(true);

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
  }) => {
    const params = new URLSearchParams({
      song: track.name,
      artist: track.artist,
      lyrics: track.syncedLyrics,
    });
    router.push(`/result?${params.toString()}`);
  };

  const handlePasteSubmit = () => {
    if (!lyrics.trim()) {
      setError('请粘贴歌词内容');
      return;
    }
    const params = new URLSearchParams({
      song: query || '未知歌曲',
      artist: '',
      lyrics: lyrics,
    });
    router.push(`/result?${params.toString()}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setLyrics(content);
      setMode('paste');
    };
    reader.readAsText(file);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-6 py-16">
      {/* 标题 */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-primary neon-red mb-4">
          粤瓷
        </h1>
        <p className="text-cream-muted text-lg">
          输入歌曲名，自动标注标准粤语发音
        </p>
      </div>

      {/* 模式切换 */}
      <div className="flex gap-2 mb-8 bg-white/[0.03] border border-primary/10 rounded-lg p-1">
        <button
          onClick={() => setMode('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            mode === 'search'
              ? 'bg-primary text-cream'
              : 'text-cream-muted hover:text-cream'
          }`}
        >
          <Search size={16} />
          搜索歌曲
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
            mode === 'paste'
              ? 'bg-primary text-cream'
              : 'text-cream-muted hover:text-cream'
          }`}
        >
          <FileText size={16} />
          粘贴歌词
        </button>
      </div>

      {/* 搜索模式 */}
      {mode === 'search' && (
        <div className="w-full max-w-2xl">
          <div className="flex gap-3 mb-6">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="输入歌曲名，如：十面埋伏、岁月如歌"
              className="flex-1 bg-white/[0.03] border border-primary/10 rounded-lg px-4 py-3
                text-cream placeholder-cream-muted/50
                focus:outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-retro flex items-center gap-2"
            >
              {loading ? (
                <span className="animate-spin">⏳</span>
              ) : (
                <Search size={18} />
              )}
              搜索
            </button>
          </div>

          {/* 搜索结果 */}
          {searchResults.length > 0 && (
            <div className="space-y-3">
              <p className="text-cream-muted text-sm">
                找到 {searchResults.length} 个结果
                {!hasCantonese && (
                  <span className="text-yellow-400/80 ml-2">（未找到粤语版本，以下为其他语言版本）</span>
                )}
              </p>
              {searchResults.map((track) => (
                <button
                  key={track.id}
                  onClick={() => handleSelectTrack(track)}
                  className="w-full text-left p-4 bg-white/[0.03] border border-white/[0.04]
                    rounded-xl hover:bg-white/[0.06] hover:border-primary/20
                    transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <Music size={20} className="text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-cream font-medium truncate">
                        {track.name}
                      </div>
                      <div className="flex items-center gap-2 text-cream-muted text-sm">
                        <span>{track.artist}</span>
                        {track.album && (
                          <>
                            <span className="opacity-40">·</span>
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
        </div>
      )}

      {/* 粘贴模式 */}
      {mode === 'paste' && (
        <div className="w-full max-w-2xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="歌曲名（可选）"
            className="w-full bg-white/[0.03] border border-primary/10 rounded-lg px-4 py-3
              text-cream placeholder-cream-muted/50 mb-4
              focus:outline-none focus:border-primary/40 transition-colors"
          />

          <textarea
            value={lyrics}
            onChange={(e) => setLyrics(e.target.value)}
            placeholder="粘贴 LRC 格式歌词，如：&#10;[00:12.34]愛上了 看見你&#10;[00:16.78]何等的奇妙"
            rows={12}
            className="w-full bg-white/[0.03] border border-primary/10 rounded-lg px-4 py-3
              text-cream placeholder-cream-muted/50 font-mono text-sm
              focus:outline-none focus:border-primary/40 transition-colors resize-y mb-4"
          />

          <div className="flex gap-3">
            <button onClick={handlePasteSubmit} className="btn-retro flex items-center gap-2">
              <FileText size={18} />
              开始转换
            </button>

            <label className="flex items-center gap-2 px-4 py-2 rounded-lg
              bg-white/[0.03] border border-primary/10 text-cream-muted
              hover:text-cream hover:border-primary/20 cursor-pointer transition-all">
              <Upload size={18} />
              上传文件
              <input
                type="file"
                accept=".lrc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <div className="mt-6 px-4 py-3 bg-primary/10 border border-primary/20 rounded-lg text-primary">
          {error}
        </div>
      )}

      {/* 底部说明 */}
      <div className="mt-16 text-center text-cream-muted text-sm max-w-xl">
        <p>
          数据来源：
          <span className="text-jade">LRCLIB</span>（歌词时间轴）+
          <span className="text-jade">翡翠粤语歌词</span>（权威粤拼标注）
        </p>
        <p className="mt-2 opacity-60">
          粤拼标注由翡翠粤语歌词(feitsui.com)提供，版权归原始作者所有
        </p>
      </div>
    </main>
  );
}
