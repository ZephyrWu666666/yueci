'use client';

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Download, Copy, Check, Loader2, Edit3, X } from 'lucide-react';
import { AlignedLine } from '@/lib/types';
import { generateLrc, downloadLrc } from '@/lib/lrc-generator';
import * as OpenCC from 'opencc-js';

type CharMode = 'traditional' | 'simplified';

interface EditableChar {
  char: string;
  jyutping: string;
  lineIndex: number;
  charIndex: number;
}

function ResultContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const songName = searchParams.get('song') || '未知歌曲';
  const artistName = searchParams.get('artist') || '';
  const syncedLyrics = searchParams.get('lyrics') || '';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alignedLines, setAlignedLines] = useState<AlignedLine[]>([]);
  const [source, setSource] = useState('');
  const [coverage, setCoverage] = useState(0);
  const [copied, setCopied] = useState(false);
  const [charMode, setCharMode] = useState<CharMode>('traditional');
  const [editMode, setEditMode] = useState(false);
  const [activeChar, setActiveChar] = useState<EditableChar | null>(null);
  const [altReadings, setAltReadings] = useState<string[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);

  // 转换器
  const converter = useMemo(() => {
    if (charMode === 'simplified') {
      return OpenCC.Converter({ from: 'tw', to: 'cn' });
    }
    return OpenCC.Converter({ from: 'cn', to: 'tw' });
  }, [charMode]);

  // 当前 LRC 内容（基于 alignedLines 动态生成）
  const lrcContent = useMemo(() => {
    return generateLrc(alignedLines, { songName, artistName });
  }, [alignedLines, songName, artistName]);

  // 转换歌词行
  const displayLines = useMemo(() => {
    return alignedLines.map((line) => ({
      ...line,
      text: converter(line.text),
    }));
  }, [alignedLines, converter]);

  useEffect(() => {
    if (!syncedLyrics) {
      setError('未提供歌词内容');
      setLoading(false);
      return;
    }

    const processLyrics = async () => {
      try {
        const res = await fetch('/api/jyutping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ syncedLyrics, songName, artistName }),
        });

        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setAlignedLines(data.alignedLines);
        setSource(data.source);
        setCoverage(data.coverage);
      } catch {
        setError('处理失败，请稍后重试');
      } finally {
        setLoading(false);
      }
    };

    processLyrics();
  }, [syncedLyrics, songName, artistName]);

  // 点击某个字的粤拼，查询所有读音
  const handleCharClick = useCallback(async (lineIndex: number, charIndex: number) => {
    const line = alignedLines[lineIndex];
    if (!line) return;

    const chars = line.text.replace(/[^一-鿿]/g, '').split('');
    const jyutpings = line.jyutping.split(' ').filter((j) => /^[a-z]+\d$/.test(j));

    if (charIndex >= chars.length || charIndex >= jyutpings.length) return;

    const char = chars[charIndex];
    const currentJyutping = jyutpings[charIndex];

    setActiveChar({ char, jyutping: currentJyutping, lineIndex, charIndex });
    setAltReadings([]);
    setLoadingReadings(true);

    try {
      const res = await fetch(`/api/lookup?char=${encodeURIComponent(char)}`);
      const data = await res.json();
      setAltReadings(data.readings || []);
    } catch {
      setAltReadings([currentJyutping]);
    } finally {
      setLoadingReadings(false);
    }
  }, [alignedLines]);

  // 选择替代读音
  const handleSelectReading = useCallback((newReading: string) => {
    if (!activeChar) return;

    setAlignedLines((prev) => {
      const updated = [...prev];
      const line = { ...updated[activeChar.lineIndex] };
      const jyutpings = line.jyutping.split(' ');
      // 只替换有效的粤拼 token
      let validIndex = 0;
      for (let i = 0; i < jyutpings.length; i++) {
        if (/^[a-z]+\d$/.test(jyutpings[i])) {
          if (validIndex === activeChar.charIndex) {
            jyutpings[i] = newReading;
            break;
          }
          validIndex++;
        }
      }
      line.jyutping = jyutpings.join(' ');
      updated[activeChar.lineIndex] = line;
      return updated;
    });

    setActiveChar(null);
  }, [activeChar]);

  const handleDownload = () => {
    const filename = artistName
      ? `${artistName} - ${songName}.lrc`
      : `${songName}.lrc`;
    downloadLrc(lrcContent, filename);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(lrcContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleCharMode = () => {
    setCharMode((prev) => (prev === 'traditional' ? 'simplified' : 'traditional'));
  };

  // 解析粤拼音行，标记每个字和对应的粤拼
  const parseLineForEdit = (text: string, jyutping: string) => {
    const chars: string[] = [];
    for (const ch of text) {
      if (/[一-鿿]/.test(ch)) chars.push(ch);
    }
    const pinyins = jyutping.split(' ').filter((j) => /^[a-z]+\d$/.test(j));
    const pairs: { char: string; pinyin: string }[] = [];
    for (let i = 0; i < chars.length; i++) {
      pairs.push({ char: chars[i], pinyin: pinyins[i] || '' });
    }
    return pairs;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 size={48} className="text-primary animate-spin mb-4" />
        <p className="text-cream-muted">正在标注粤拼...</p>
        <p className="text-cream-muted text-sm mt-2">正在从翡翠歌词获取权威发音数据</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6">
        <div className="text-center">
          <p className="text-primary text-xl mb-4">{error}</p>
          <button onClick={() => router.push('/')} className="btn-retro">
            返回重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen flex flex-col px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto">
      {/* 顶部导航 */}
      <button
        onClick={() => router.push('/')}
        className="flex items-center gap-2 text-cream-muted hover:text-primary transition-colors mb-6 sm:mb-8 active:opacity-70"
      >
        <ArrowLeft size={18} />
        返回
      </button>

      {/* 歌曲信息 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-cream neon-red mb-3">
          {artistName ? `${artistName} - ${songName}` : songName}
        </h1>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-xs sm:text-sm ${
              source === 'feitsui'
                ? 'bg-jade-dark/50 text-jade'
                : 'bg-accent/20 text-accent'
            }`}
          >
            {source === 'feitsui' ? '✓ 翡翠（权威）' : '⚠ 字典（兜底）'}
          </span>
          <span className="text-cream-muted text-xs sm:text-sm">
            覆盖率: {Math.round(coverage * 100)}%
          </span>
          <button
            onClick={toggleCharMode}
            className="px-2.5 py-1 rounded-full text-xs sm:text-sm bg-white/[0.03] border border-primary/10
              text-cream hover:bg-white/[0.06] hover:border-primary/20 transition-all active:scale-95"
          >
            {charMode === 'traditional' ? '繁體' : '简体'}
          </button>
          <button
            onClick={() => { setEditMode(!editMode); setActiveChar(null); }}
            className={`px-2.5 py-1 rounded-full text-xs sm:text-sm border transition-all flex items-center gap-1.5 active:scale-95 ${
              editMode
                ? 'bg-primary/20 border-primary/40 text-primary'
                : 'bg-white/[0.03] border-primary/10 text-cream hover:bg-white/[0.06] hover:border-primary/20'
            }`}
          >
            <Edit3 size={14} />
            {editMode ? '退出审核' : '审核粤拼'}
          </button>
        </div>
      </div>

      {/* 歌词预览 / 编辑 */}
      <div className="bg-white/[0.03] border border-white/[0.04] rounded-lg sm:rounded-xl p-4 sm:p-6 mb-6 sm:mb-8 flex-1 min-h-0 overflow-y-auto relative">
        {editMode && (
          <div className="mb-4 px-3 py-2 bg-primary/10 border border-primary/20 rounded-lg text-xs sm:text-sm text-cream-muted">
            点击粤拼音节可修改多音字读音，修改后直接下载即可保存
          </div>
        )}

        {displayLines.map((line, lineIndex) => (
          <div
            key={lineIndex}
            className="animate-fade-in mb-3 sm:mb-4"
            style={{ animationDelay: `${lineIndex * 0.03}s` }}
          >
            <div className="text-cream-muted text-xs mb-1">{line.time}</div>
            <div className="text-lg sm:text-xl text-cream mb-1">{line.text}</div>
            {line.jyutping && (
              <div className="text-sm font-medium">
                {editMode ? (
                  <span className="inline-flex flex-wrap gap-x-0.5">
                    {parseLineForEdit(alignedLines[lineIndex].text, alignedLines[lineIndex].jyutping).map((pair, charIdx) => (
                      <span key={charIdx} className="inline-flex flex-col items-center">
                        <span className="text-xs text-cream-muted/50 leading-none">{pair.char}</span>
                        <button
                          onClick={() => handleCharClick(lineIndex, charIdx)}
                          className={`px-1 py-0.5 rounded text-sm leading-tight transition-all ${
                            activeChar?.lineIndex === lineIndex && activeChar?.charIndex === charIdx
                              ? 'bg-primary text-cream neon-red'
                              : 'text-jade neon-green hover:bg-jade-dark/30 active:bg-jade-dark/50'
                          }`}
                        >
                          {pair.pinyin || '?'}
                        </button>
                      </span>
                    ))}
                  </span>
                ) : (
                  <span className="text-jade neon-green">{line.jyutping}</span>
                )}
              </div>
            )}
          </div>
        ))}

        {/* 替代读音弹窗 */}
        {activeChar && (
          <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50" onClick={() => setActiveChar(null)}>
            <div
              className="bg-surface-light border border-primary/20 rounded-t-2xl sm:rounded-xl p-5 sm:p-6 max-w-sm w-full mx-0 sm:mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-3xl text-cream mr-3">{activeChar.char}</span>
                  <span className="text-jade text-lg">当前: {activeChar.jyutping}</span>
                </div>
                <button onClick={() => setActiveChar(null)} className="text-cream-muted hover:text-cream p-1">
                  <X size={20} />
                </button>
              </div>

              {loadingReadings ? (
                <div className="flex items-center gap-2 text-cream-muted py-4">
                  <Loader2 size={16} className="animate-spin" />
                  查询读音中...
                </div>
              ) : altReadings.length > 0 ? (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                  <p className="text-cream-muted text-sm mb-3">选择正确读音：</p>
                  {altReadings.map((reading, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectReading(reading)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all flex items-center justify-between active:scale-[0.98] ${
                        reading === activeChar.jyutping
                          ? 'bg-primary/20 border border-primary/40 text-primary'
                          : 'bg-white/[0.03] border border-white/[0.04] text-cream hover:bg-white/[0.06] hover:border-primary/20'
                      }`}
                    >
                      <span className="text-lg font-mono">{reading}</span>
                      {reading === activeChar.jyutping && (
                        <span className="text-xs text-primary">当前</span>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-cream-muted py-4">未找到其他读音</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3 sm:gap-4">
        <button onClick={handleDownload} className="btn-retro flex items-center gap-2 text-sm sm:text-base">
          <Download size={18} />
          下载 LRC 文件
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-lg text-sm sm:text-base
            bg-white/[0.03] border border-primary/10 text-cream
            hover:bg-white/[0.06] hover:border-primary/20 transition-all active:scale-95"
        >
          {copied ? <Check size={18} className="text-jade" /> : <Copy size={18} />}
          {copied ? '已复制' : '复制内容'}
        </button>
      </div>

      {/* 底部说明 */}
      <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-primary/10 text-cream-muted text-xs sm:text-sm pb-4">
        <p>
          粤拼数据来源：
          <span className="text-jade">
            {source === 'feitsui' ? '翡翠粤语歌词 (feitsui.com)' : '本地 rime-cantonese 字典'}
          </span>
        </p>
      </div>
    </main>
  );
}

function ResultPageInner() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 size={48} className="text-primary animate-spin" />
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}

export default dynamic(() => Promise.resolve(ResultPageInner), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 size={48} className="text-primary animate-spin" />
    </div>
  ),
});
