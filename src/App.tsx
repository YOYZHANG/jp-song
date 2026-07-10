import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Download,
  Eraser,
  ExternalLink,
  FileDown,
  FileUp,
  Languages,
  Library,
  Loader2,
  Minus,
  Mic2,
  Play,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Sparkles,
  Star,
  Trash2,
  Upload,
  Volume2,
  X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { sampleSongs } from "./data/sampleSongs";
import { clearLocalAudioLibrary, readLocalAudio, removeLocalAudio, saveLocalAudio } from "./lib/localAudio";
import { searchLRCLIB } from "./lib/lrclib";
import { speakJapanese } from "./lib/speech";
import { readJSON, removeJSON, writeJSON } from "./lib/storage";
import { getCachedTranslation, translateLine } from "./lib/translation";
import type { LyricLine, Song, TabID, VocabularyItem } from "./types";

const savedSongsKey = "sssong-web-saved-songs";
const savedVocabularyKey = "sssong-web-saved-vocabulary";
const translationsKey = "sssong-web-translations";
const retiredStudyStorageKeys = ["sssong-web-ai-grammar"];

type AppRoute =
  | { type: "tab" }
  | { type: "song"; song: Song; sourceTab: TabID }
  | { type: "line"; song: Song; lineID: string; sourceTab: TabID };

type VocabularyFilter = "all" | "unlearned" | "learned";
type VocabularyViewMode = "list" | "cards";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabID>("search");
  const [route, setRoute] = useState<AppRoute>({ type: "tab" });
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Song[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [savedSongs, setSavedSongs] = useState<Song[]>(() => readJSON<Song[]>(savedSongsKey, []));
  const [savedWords, setSavedWords] = useState<VocabularyItem[]>(() => readJSON<VocabularyItem[]>(savedVocabularyKey, []));

  useEffect(() => {
    retiredStudyStorageKeys.forEach(removeJSON);
  }, []);
  useEffect(() => writeJSON(savedSongsKey, savedSongs), [savedSongs]);
  useEffect(() => writeJSON(savedVocabularyKey, savedWords), [savedWords]);

  const displaySongs = query.trim() ? results : sampleSongs;
  const activeLine = route.type === "line" ? route.song.lyricLines.find((line) => line.id === route.lineID) ?? route.song.lyricLines[0] ?? null : null;

  function showTab(tab: TabID) {
    setActiveTab(tab);
    setRoute({ type: "tab" });
  }

  function openSong(song: Song) {
    setRoute({ type: "song", song, sourceTab: activeTab });
  }

  function openLine(song: Song, lineID = song.lyricLines[0]?.id ?? "") {
    const sourceTab = route.type === "tab" ? activeTab : route.sourceTab;
    setRoute({ type: "line", song, lineID, sourceTab });
  }

  async function runSearch(event?: React.FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setStatusMessage(null);
      return;
    }

    const localMatches = sampleSongs.filter((song) => songMatches(song, trimmed));
    setResults(localMatches);
    setIsSearching(true);
    setStatusMessage("正在搜索 LRCLIB 歌词...");

    const controller = new AbortController();
    try {
      const onlineSongs = await searchLRCLIB(trimmed, controller.signal);
      const mergedSongs = mergeSongs(onlineSongs, localMatches);
      setResults(mergedSongs);
      setStatusMessage(onlineSongs.length ? "来自 LRCLIB 的在线歌词" : localMatches.length ? "没有找到在线歌词，已显示本地结果。" : "没有找到可用歌词。");
    } catch (error) {
      setResults(localMatches);
      setStatusMessage(localMatches.length ? "在线搜索失败，已显示本地结果。" : error instanceof Error ? error.message : "在线搜索失败。");
    } finally {
      setIsSearching(false);
    }
  }

  function toggleSavedSong(song: Song) {
    setSavedSongs((current) => {
      if (current.some((item) => item.id === song.id)) {
        if (song.localAudioFileName) {
          void removeLocalAudio(song.id);
        }
        return current.filter((item) => item.id !== song.id);
      }
      return [song, ...current];
    });
  }

  function applySongUpdate(updatedSong: Song) {
    setSavedSongs((current) => {
      const exists = current.some((item) => item.id === updatedSong.id);
      return exists
        ? current.map((item) => (item.id === updatedSong.id ? updatedSong : item))
        : [updatedSong, ...current];
    });
    setResults((current) => current.map((item) => (item.id === updatedSong.id ? updatedSong : item)));
    setRoute((current) => {
      if (current.type === "song" && current.song.id === updatedSong.id) {
        return { ...current, song: updatedSong };
      }
      if (current.type === "line" && current.song.id === updatedSong.id) {
        return { ...current, song: updatedSong };
      }
      return current;
    });
  }

  async function bindLocalAudio(song: Song, file: File) {
    await saveLocalAudio(song.id, file);
    applySongUpdate({
      ...song,
      localAudioFileName: file.name,
      localAudioMimeType: file.type || "audio/mpeg",
      localAudioOffsetSeconds: 0
    });
  }

  async function unbindLocalAudio(song: Song) {
    await removeLocalAudio(song.id);
    const updatedSong = { ...song };
    delete updatedSong.localAudioFileName;
    delete updatedSong.localAudioMimeType;
    delete updatedSong.localAudioOffsetSeconds;
    applySongUpdate(updatedSong);
  }

  function updateLocalAudioOffset(song: Song, offsetSeconds: number) {
    applySongUpdate({
      ...song,
      localAudioOffsetSeconds: normalizeAudioOffset(offsetSeconds)
    });
  }

  function toggleSavedWord(word: VocabularyItem) {
    setSavedWords((current) => {
      if (current.some((item) => item.id === word.id)) {
        return current.filter((item) => item.id !== word.id);
      }
      return [word, ...current];
    });
  }

  function removeSavedWord(word: VocabularyItem) {
    setSavedWords((current) => current.filter((item) => item.id !== word.id));
  }

  function setSavedWordLearned(word: VocabularyItem, learned: boolean) {
    const now = new Date().toISOString();
    setSavedWords((current) =>
      current.map((item) =>
        item.id === word.id
          ? {
              ...item,
              learnedAt: learned ? item.learnedAt ?? now : undefined,
              lastStudiedAt: now
            }
          : item
      )
    );
  }

  function reviewSavedWord(word: VocabularyItem, knewWord: boolean) {
    const now = new Date().toISOString();
    setSavedWords((current) =>
      current.map((item) =>
        item.id === word.id
          ? {
              ...item,
              learnedAt: knewWord ? item.learnedAt ?? now : undefined,
              lastStudiedAt: now,
              reviewCount: (item.reviewCount ?? 0) + 1
            }
          : item
      )
    );
  }

  function importStudyData(data: StudyDataPackage) {
    if (Array.isArray(data.savedSongs)) {
      setSavedSongs(data.savedSongs);
    }
    if (Array.isArray(data.savedWords)) {
      setSavedWords(data.savedWords);
    }
    if (data.translations && typeof data.translations === "object") {
      writeJSON(translationsKey, data.translations);
    }
  }

  function clearStudyData() {
    setSavedSongs([]);
    setSavedWords([]);
    removeJSON(translationsKey);
    retiredStudyStorageKeys.forEach(removeJSON);
    void clearLocalAudioLibrary();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" type="button" onClick={() => showTab("search")}>
          <span className="brand-mark">日</span>
          <span>
            <strong>日语</strong>
            <small>歌曲学习</small>
          </span>
        </button>

        <nav className="nav-tabs" aria-label="主导航">
          <NavButton icon={<Search size={20} />} label="歌曲" active={activeTab === "search"} onClick={() => showTab("search")} />
          <NavButton icon={<Library size={20} />} label="本地" active={activeTab === "saved"} onClick={() => showTab("saved")} />
          <NavButton icon={<BookOpen size={20} />} label="生词本" active={activeTab === "vocabulary"} onClick={() => showTab("vocabulary")} />
          <NavButton icon={<Settings size={20} />} label="设置" active={activeTab === "settings"} onClick={() => showTab("settings")} />
        </nav>
      </aside>

      <main className="main-area">
        {route.type === "tab" && activeTab === "search" && (
          <SearchWorkspace
            query={query}
            setQuery={setQuery}
            songs={displaySongs}
            isSearching={isSearching}
            statusMessage={statusMessage}
            savedSongs={savedSongs}
            onSearch={runSearch}
            onOpenSong={openSong}
            onToggleSaved={toggleSavedSong}
          />
        )}

        {route.type === "tab" && activeTab === "saved" && (
          <SavedWorkspace
            songs={savedSongs}
            onOpenSong={openSong}
            onToggleSaved={toggleSavedSong}
            onGoSearch={() => showTab("search")}
          />
        )}

        {route.type === "tab" && activeTab === "vocabulary" && (
          <VocabularyWorkspace
            words={savedWords}
            onSpeak={speakJapanese}
            onRemove={removeSavedWord}
            onSetLearned={setSavedWordLearned}
            onReviewWord={reviewSavedWord}
          />
        )}

        {route.type === "tab" && activeTab === "settings" && (
          <SettingsWorkspace
            savedSongs={savedSongs}
            savedWords={savedWords}
            onImport={importStudyData}
            onClear={clearStudyData}
          />
        )}

        {route.type === "song" && (
          <SongDetailPage
            song={route.song}
            saved={savedSongs.some((song) => song.id === route.song.id)}
            onBack={() => showTab(route.sourceTab)}
            onToggleSaved={() => toggleSavedSong(route.song)}
            onOpenLine={(song, lineID) => openLine(song, lineID)}
            onBindLocalAudio={bindLocalAudio}
            onRemoveLocalAudio={unbindLocalAudio}
            onUpdateLocalAudioOffset={updateLocalAudioOffset}
          />
        )}

        {route.type === "line" && activeLine && (
          <LineStudyPage
            song={route.song}
            line={activeLine}
            savedWords={savedWords}
            isSongSaved={savedSongs.some((song) => song.id === route.song.id)}
            onBack={() => setRoute({ type: "song", song: route.song, sourceTab: route.sourceTab })}
            onLineChange={(lineID) => setRoute({ type: "line", song: route.song, lineID, sourceTab: route.sourceTab })}
            onToggleSong={() => toggleSavedSong(route.song)}
            onToggleWord={toggleSavedWord}
          />
        )}
      </main>
    </div>
  );
}

interface SearchWorkspaceProps {
  query: string;
  setQuery: (query: string) => void;
  songs: Song[];
  isSearching: boolean;
  statusMessage: string | null;
  savedSongs: Song[];
  onSearch: (event?: React.FormEvent<HTMLFormElement>) => void;
  onOpenSong: (song: Song, lineID?: string) => void;
  onToggleSaved: (song: Song) => void;
}

function SearchWorkspace({ query, setQuery, songs, isSearching, statusMessage, savedSongs, onSearch, onOpenSong, onToggleSaved }: SearchWorkspaceProps) {
  return (
    <div className="workspace">
      <section className="search-hero">
        <div className="hero-copy">
          <p className="eyebrow">Japanese lyric study</p>
          <h1>用歌曲学日语</h1>
        </div>

        <form className="search-box" onSubmit={onSearch}>
          <Search size={22} aria-hidden />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入歌名、歌手或日语歌词"
            aria-label="搜索歌曲"
          />
          {query && (
            <button className="icon-button muted" type="button" onClick={() => setQuery("")} aria-label="清空搜索">
              <X size={18} />
            </button>
          )}
          <button className="primary-button" type="submit" disabled={isSearching}>
            {isSearching ? <Loader2 className="spin" size={18} /> : <Search size={18} />}
            <span>搜索</span>
          </button>
        </form>
      </section>

      <div className="status-row">
        <span>{statusMessage ?? (query.trim() ? "输入后回车搜索 LRCLIB 歌词。" : "本地示例歌曲")}</span>
        {isSearching && <Loader2 className="spin" size={16} />}
      </div>

      <section className="song-list song-results-grid" aria-label="歌曲列表">
        {songs.length > 0 ? (
          songs.map((song) => (
            <SongCard
              key={song.id}
              song={song}
              active={false}
              saved={savedSongs.some((item) => item.id === song.id)}
              onOpen={() => onOpenSong(song)}
              onToggleSaved={() => onToggleSaved(song)}
            />
          ))
        ) : (
          <EmptyState icon={<Search size={28} />} title="暂无结果" description="换一个歌名、歌手或日语关键词试试。" />
        )}
      </section>
    </div>
  );
}

interface SavedWorkspaceProps {
  songs: Song[];
  onOpenSong: (song: Song, lineID?: string) => void;
  onToggleSaved: (song: Song) => void;
  onGoSearch: () => void;
}

function SavedWorkspace({ songs, onOpenSong, onToggleSaved, onGoSearch }: SavedWorkspaceProps) {
  return (
    <div className="workspace simple-workspace">
      <WorkspaceHeader icon={<Library size={22} />} title="本地歌曲" detail={`${songs.length} 首`} />
      {songs.length ? (
        <div className="saved-grid">
          {songs.map((song) => (
            <SongCard key={song.id} song={song} active={false} saved onOpen={() => onOpenSong(song)} onToggleSaved={() => onToggleSaved(song)} />
          ))}
        </div>
      ) : (
        <EmptyState icon={<Library size={28} />} title="还没有保存歌曲" description="在歌曲页点星标后会保存在当前浏览器。" actionLabel="去搜索" onAction={onGoSearch} />
      )}
    </div>
  );
}

interface VocabularyWorkspaceProps {
  words: VocabularyItem[];
  onSpeak: (text: string) => void;
  onRemove: (word: VocabularyItem) => void;
  onSetLearned: (word: VocabularyItem, learned: boolean) => void;
  onReviewWord: (word: VocabularyItem, knewWord: boolean) => void;
}

function VocabularyWorkspace({ words, onSpeak, onRemove, onSetLearned, onReviewWord }: VocabularyWorkspaceProps) {
  const [filter, setFilter] = useState<VocabularyFilter>("all");
  const [viewMode, setViewMode] = useState<VocabularyViewMode>("list");
  const learnedCount = words.filter(isVocabularyLearned).length;
  const unlearnedCount = words.length - learnedCount;
  const filteredWords = words.filter((word) => {
    if (filter === "learned") {
      return isVocabularyLearned(word);
    }
    if (filter === "unlearned") {
      return !isVocabularyLearned(word);
    }
    return true;
  });

  return (
    <div className="workspace simple-workspace">
      <WorkspaceHeader icon={<BookOpen size={22} />} title="生词本" detail={`${words.length} 张卡片 · ${unlearnedCount} 未学 · ${learnedCount} 已学过`} />
      {words.length ? (
        <>
          <section className="vocabulary-dashboard">
            <div className="vocabulary-controls">
              <div className="segmented-control" aria-label="筛选生词">
                <button className={filter === "all" ? "is-active" : ""} type="button" onClick={() => setFilter("all")}>
                  全部
                </button>
                <button className={filter === "unlearned" ? "is-active" : ""} type="button" onClick={() => setFilter("unlearned")}>
                  未学
                </button>
                <button className={filter === "learned" ? "is-active" : ""} type="button" onClick={() => setFilter("learned")}>
                  已学过
                </button>
              </div>
              <div className="segmented-control" aria-label="切换学习模式">
                <button className={viewMode === "list" ? "is-active" : ""} type="button" onClick={() => setViewMode("list")}>
                  列表
                </button>
                <button className={viewMode === "cards" ? "is-active" : ""} type="button" onClick={() => setViewMode("cards")}>
                  卡片
                </button>
              </div>
            </div>
          </section>

          {filteredWords.length ? (
            viewMode === "cards" ? (
              <VocabularyStudyDeck
                key={filter}
                words={filteredWords}
                onSpeak={onSpeak}
                onSetLearned={onSetLearned}
                onReviewWord={onReviewWord}
              />
            ) : (
              <div className="word-grid">
                {filteredWords.map((word) => {
                  const learned = isVocabularyLearned(word);
                  return (
                    <article className="word-card" key={word.id}>
                      <div className="word-card-header">
                        <div>
                          <p className="word-main">{word.word}</p>
                          <p className="word-reading">{word.reading}</p>
                        </div>
                        <span className={`word-status ${learned ? "is-learned" : ""}`}>{learned ? "已学过" : "未学"}</span>
                      </div>
                      <p className="word-part">{word.partOfSpeech}</p>
                      <p className="word-meaning">{word.meaning}</p>
                      <p className="word-example">{word.example}</p>
                      <p className="word-progress">{formatVocabularyProgress(word)}</p>
                      <div className="card-actions">
                        <button className="secondary-button" type="button" onClick={() => onSpeak(word.word)}>
                          <Volume2 size={16} />
                          <span>朗读</span>
                        </button>
                        <button className="secondary-button" type="button" onClick={() => onSetLearned(word, !learned)}>
                          {learned ? <RotateCcw size={16} /> : <Check size={16} />}
                          <span>{learned ? "设为未学" : "标记已学过"}</span>
                        </button>
                        <button className="icon-button danger" type="button" onClick={() => onRemove(word)} aria-label="删除生词">
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <EmptyState icon={<BookOpen size={28} />} title="这个筛选下没有生词" description="切换到其他筛选，或在分句学习里继续收藏。" />
          )}
        </>
      ) : (
        <EmptyState icon={<BookOpen size={28} />} title="还没有生词" description="在分句学习里点加号收藏。" />
      )}
    </div>
  );
}

function VocabularyStudyDeck({
  words,
  onSpeak,
  onSetLearned,
  onReviewWord
}: {
  words: VocabularyItem[];
  onSpeak: (text: string) => void;
  onSetLearned: (word: VocabularyItem, learned: boolean) => void;
  onReviewWord: (word: VocabularyItem, knewWord: boolean) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const currentWord = words[currentIndex] ?? words[0];
  const learned = currentWord ? isVocabularyLearned(currentWord) : false;

  useEffect(() => {
    setCurrentIndex((index) => Math.min(index, Math.max(words.length - 1, 0)));
    setIsRevealed(false);
  }, [words.length]);

  function goToCard(nextIndex: number) {
    if (!words.length) {
      return;
    }
    const normalizedIndex = (nextIndex + words.length) % words.length;
    setCurrentIndex(normalizedIndex);
    setIsRevealed(false);
  }

  function reviewCurrentWord(knewWord: boolean) {
    if (!currentWord) {
      return;
    }
    onReviewWord(currentWord, knewWord);
    if (words.length > 1) {
      goToCard(currentIndex + 1);
      return;
    }
    setIsRevealed(false);
  }

  if (!currentWord) {
    return null;
  }

  return (
    <section className="study-deck" aria-label="生词卡片学习">
      <div className="deck-topline">
        <span>
          {currentIndex + 1} / {words.length}
        </span>
        <span className={`word-status ${learned ? "is-learned" : ""}`}>{learned ? "已学过" : "未学"}</span>
      </div>

      <article className="study-word-card">
        <button className="icon-button study-speak-button" type="button" onClick={() => onSpeak(currentWord.word)} aria-label={`朗读 ${currentWord.word}`}>
          <Volume2 size={18} />
        </button>
        <p className="study-word-main">{currentWord.word}</p>
        <p className="study-word-reading">{currentWord.reading || "读音待补充"}</p>
        {isRevealed ? (
          <div className="study-word-back">
            <span>{currentWord.partOfSpeech}</span>
            <strong>{currentWord.meaning}</strong>
            <p>{currentWord.example}</p>
            <small>{formatVocabularyProgress(currentWord)}</small>
          </div>
        ) : (
          <button className="secondary-button reveal-button" type="button" onClick={() => setIsRevealed(true)}>
            <BookOpen size={17} />
            <span>显示释义</span>
          </button>
        )}
      </article>

      <div className="deck-actions">
        <button className="secondary-button" type="button" onClick={() => goToCard(currentIndex - 1)}>
          <ArrowLeft size={16} />
          <span>上一张</span>
        </button>
        <button className="secondary-button" type="button" onClick={() => reviewCurrentWord(false)}>
          <RotateCcw size={16} />
          <span>还不熟</span>
        </button>
        <button className="primary-button" type="button" onClick={() => reviewCurrentWord(true)}>
          <Check size={17} />
          <span>认识</span>
        </button>
        <button className="secondary-button" type="button" onClick={() => goToCard(currentIndex + 1)}>
          <span>下一张</span>
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="deck-footer">
        <button className="text-button" type="button" onClick={() => onSetLearned(currentWord, !learned)}>
          {learned ? "设为未学" : "直接标记已学过"}
        </button>
      </div>
    </section>
  );
}

interface SettingsWorkspaceProps {
  savedSongs: Song[];
  savedWords: VocabularyItem[];
  onImport: (data: StudyDataPackage) => void;
  onClear: () => void;
}

function SettingsWorkspace({ savedSongs, savedWords, onImport, onClear }: SettingsWorkspaceProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function exportData() {
    const data: StudyDataPackage = {
      version: 1,
      exportedAt: new Date().toISOString(),
      savedSongs,
      savedWords,
      translations: readJSON<Record<string, string>>(translationsKey, {})
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "nihongo-study-data-web.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("已导出 JSON 文件。");
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text) as StudyDataPackage;
      onImport(data);
      setMessage("已导入学习数据。");
    } catch {
      setMessage("导入失败，请检查 JSON 文件。");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="workspace simple-workspace">
      <WorkspaceHeader icon={<Settings size={22} />} title="设置" detail="本地数据" />
      <div className="settings-grid">
        <section className="settings-card">
          <h2>数据</h2>
          <div className="metric-row">
            <span>本地歌曲</span>
            <strong>{savedSongs.length}</strong>
          </div>
          <div className="metric-row">
            <span>生词卡片</span>
            <strong>{savedWords.length}</strong>
          </div>
          <div className="settings-actions">
            <button className="primary-button" type="button" onClick={exportData}>
              <FileDown size={18} />
              <span>导出</span>
            </button>
            <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()}>
              <FileUp size={18} />
              <span>导入</span>
            </button>
            <button className="secondary-button danger-text" type="button" onClick={onClear}>
              <Eraser size={18} />
              <span>清空</span>
            </button>
          </div>
          <input ref={fileInputRef} className="hidden-input" type="file" accept="application/json,.json" onChange={handleFileChange} />
          {message && <p className="settings-message">{message}</p>}
        </section>

        <section className="settings-card">
          <h2>运行方式</h2>
          <div className="capability-list">
            <div className="capability-item capability-important">
              <Check size={16} />
              <div className="capability-copy">
                <strong>【重要】浏览器本地保存</strong>
                <small>更换浏览器或清除浏览器数据会丢失本地歌曲、生词等数据，记得及时导出。</small>
              </div>
            </div>
            <span><Check size={16} /> LRCLIB 在线歌词</span>
            <span><Check size={16} /> 详情页绑定本地音频</span>
            <span><Check size={16} /> 歌词解析 Prompt</span>
            <span><Check size={16} /> 浏览器语音朗读</span>
            <span><Check size={16} /> JSON 迁移</span>
          </div>
        </section>
      </div>
    </div>
  );
}

interface SongCardProps {
  song: Song;
  active: boolean;
  saved: boolean;
  onOpen: () => void;
  onToggleSaved: () => void;
}

function SongCard({ song, active, saved, onOpen, onToggleSaved }: SongCardProps) {
  return (
    <article className={`song-card ${active ? "is-active" : ""}`}>
      <button className="song-card-main" type="button" onClick={onOpen}>
        <Artwork song={song} size="small" />
        <span>
          <strong>{song.title}</strong>
          <small>{song.artist}</small>
        </span>
      </button>
      <div className="song-card-meta">
        <span>{song.level}</span>
        <span>{song.lyricLines.length} 句</span>
        {song.localAudioFileName && <span>有音频</span>}
      </div>
      <button className={`icon-button ${saved ? "saved" : ""}`} type="button" onClick={onToggleSaved} aria-label={saved ? "取消保存" : "保存歌曲"}>
        <Star size={18} fill={saved ? "currentColor" : "none"} />
      </button>
    </article>
  );
}

interface SongDetailProps {
  song: Song;
  saved: boolean;
  onToggleSaved: () => void;
  onOpenLine: (song: Song, lineID?: string) => void;
  onBindLocalAudio: (song: Song, file: File) => Promise<void>;
  onRemoveLocalAudio: (song: Song) => Promise<void>;
  onUpdateLocalAudioOffset: (song: Song, offsetSeconds: number) => void;
}

function SongDetail({ song, saved, onToggleSaved, onOpenLine, onBindLocalAudio, onRemoveLocalAudio, onUpdateLocalAudioOffset }: SongDetailProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const linePlaybackRef = useRef<{ lineID: string; endTime: number } | null>(null);
  const [activeLineID, setActiveLineID] = useState<string | null>(null);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const audioOffsetSeconds = song.localAudioOffsetSeconds ?? 0;
  const canPlayLyrics = Boolean(song.localAudioFileName && isAudioReady);

  useEffect(() => {
    linePlaybackRef.current = null;
    setActiveLineID(null);
    setIsAudioReady(false);
  }, [song.id, song.localAudioFileName]);

  function updateActiveLine(currentTime: number) {
    const linePlayback = linePlaybackRef.current;
    const audio = audioRef.current;
    if (linePlayback && audio && currentTime >= linePlayback.endTime) {
      audio.pause();
      audio.currentTime = linePlayback.endTime;
      setActiveLineID(linePlayback.lineID);
      linePlaybackRef.current = null;
      return;
    }

    const activeLine = findActiveLyricLine(song.lyricLines, currentTime - audioOffsetSeconds);
    setActiveLineID(activeLine?.id ?? null);
  }

  async function playLyricLine(line: LyricLine) {
    const audio = audioRef.current;
    if (!audio || !canPlayLyrics) {
      return;
    }

    const duration = Number.isFinite(audio.duration) ? audio.duration : null;
    const targetTime = line.startTime + audioOffsetSeconds;
    const maxStartTime = duration === null ? targetTime : Math.max(duration - 0.1, 0);
    const startTime = Math.max(0, Math.min(targetTime, maxStartTime));
    audio.currentTime = startTime;
    setActiveLineID(line.id);
    linePlaybackRef.current = {
      lineID: line.id,
      endTime: getLyricLineEndTime(song, line, audioOffsetSeconds, duration, startTime)
    };

    try {
      await audio.play();
    } catch (error) {
      console.error("无法播放绑定音频", error);
    }
  }

  return (
    <div className="song-detail">
      <div className="song-cover" style={gradientStyle(song)}>
        <div>
          <p>{song.level}</p>
          <h2>{song.title}</h2>
          <span>{song.artist}</span>
        </div>
        <button className={`icon-button cover-action ${saved ? "saved" : ""}`} type="button" onClick={onToggleSaved} aria-label={saved ? "取消保存" : "保存歌曲"}>
          <Star size={20} fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <p className="song-summary">{song.summary}</p>

      <LocalAudioPanel
        song={song}
        audioRef={audioRef}
        onBindLocalAudio={onBindLocalAudio}
        onRemoveLocalAudio={onRemoveLocalAudio}
        onUpdateLocalAudioOffset={onUpdateLocalAudioOffset}
        onReadyChange={setIsAudioReady}
        onTimeUpdate={updateActiveLine}
        onEnded={() => {
          linePlaybackRef.current = null;
          setActiveLineID(null);
        }}
      />

      <div className="lyric-list">
        {song.lyricLines.map((line) => (
          <div key={line.id} className={`lyric-row ${activeLineID === line.id ? "is-active" : ""} ${canPlayLyrics ? "" : "is-disabled"}`}>
            <button
              className="lyric-play-button"
              type="button"
              onClick={() => void playLyricLine(line)}
              disabled={!canPlayLyrics}
              aria-label={`从 ${formatTime(line.startTime)} 播放 ${line.japanese}`}
            >
              <time>{formatTime(line.startTime)}</time>
              <span>{line.japanese}</span>
              <Play size={16} />
            </button>
            <button className="lyric-study-button" type="button" onClick={() => onOpenLine(song, line.id)} aria-label={`学习这句歌词：${line.japanese}`}>
              <ChevronRight size={17} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocalAudioPanel({
  song,
  audioRef,
  onBindLocalAudio,
  onRemoveLocalAudio,
  onUpdateLocalAudioOffset,
  onReadyChange,
  onTimeUpdate,
  onEnded
}: {
  song: Song;
  audioRef: React.RefObject<HTMLAudioElement>;
  onBindLocalAudio: (song: Song, file: File) => Promise<void>;
  onRemoveLocalAudio: (song: Song) => Promise<void>;
  onUpdateLocalAudioOffset: (song: Song, offsetSeconds: number) => void;
  onReadyChange: (ready: boolean) => void;
  onTimeUpdate: (currentTime: number) => void;
  onEnded: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [isBinding, setIsBinding] = useState(false);
  const [didCopySongTitle, setDidCopySongTitle] = useState(false);
  const audioOffsetSeconds = song.localAudioOffsetSeconds ?? 0;
  const hasLocalAudio = Boolean(song.localAudioFileName);
  const [offsetInput, setOffsetInput] = useState(() => formatAudioOffsetInput(audioOffsetSeconds));

  useEffect(() => {
    setOffsetInput(formatAudioOffsetInput(audioOffsetSeconds));
  }, [audioOffsetSeconds]);

  useEffect(() => {
    let didCancel = false;
    let objectURL: string | null = null;

    async function loadAudio() {
      onReadyChange(false);
      if (!song.localAudioFileName) {
        setAudioURL(null);
        setStatus(null);
        return;
      }

      const blob = await readLocalAudio(song.id);
      if (didCancel) {
        return;
      }

      if (!blob) {
        setAudioURL(null);
        onReadyChange(false);
        setStatus("未找到本地音频文件。");
        return;
      }

      objectURL = URL.createObjectURL(blob);
      setAudioURL(objectURL);
      onReadyChange(false);
      setStatus(null);
    }

    void loadAudio();

    return () => {
      didCancel = true;
      if (objectURL) {
        URL.revokeObjectURL(objectURL);
      }
    };
  }, [song.id, song.localAudioFileName]);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setIsBinding(true);
    setStatus(null);
    try {
      await onBindLocalAudio(song, file);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "导入音频失败。");
    } finally {
      setIsBinding(false);
      event.target.value = "";
    }
  }

  async function handleRemoveAudio() {
    setIsBinding(true);
    setStatus(null);
    try {
      await onRemoveLocalAudio(song);
      setAudioURL(null);
      onReadyChange(false);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "移除音频失败。");
    } finally {
      setIsBinding(false);
    }
  }

  function updateOffset(nextOffset: number) {
    const normalized = normalizeAudioOffset(nextOffset);
    setOffsetInput(formatAudioOffsetInput(normalized));
    onUpdateLocalAudioOffset(song, normalized);
  }

  function commitOffsetInput() {
    const parsedOffset = Number(offsetInput);
    if (Number.isFinite(parsedOffset)) {
      updateOffset(parsedOffset);
      return;
    }
    setOffsetInput(formatAudioOffsetInput(audioOffsetSeconds));
  }

  async function copySongTitle() {
    try {
      await copyTextToClipboard(song.title);
      setDidCopySongTitle(true);
      window.setTimeout(() => setDidCopySongTitle(false), 2000);
    } catch {
      setStatus("复制歌名失败，请手动复制。");
    }
  }

  function openWebDownloadPage() {
    window.open("https://www.gequbao.com/", "_blank", "noopener,noreferrer");
  }

  return (
    <section className="local-audio-panel">
      <SectionTitle icon={<Volume2 size={17} />} title="本地音频" />
      <p>{song.localAudioFileName ?? "未绑定音频"}</p>
      {song.localAudioFileName ? (
        audioURL ? (
          <audio
            ref={audioRef}
            controls
            src={audioURL}
            onCanPlay={() => onReadyChange(true)}
            onLoadedMetadata={() => onReadyChange(true)}
            onTimeUpdate={(event) => onTimeUpdate(event.currentTarget.currentTime)}
            onEnded={onEnded}
          />
        ) : (
          <p className="muted-text">{status ?? "正在加载音频..."}</p>
        )
      ) : (
        <p className="muted-text">选择音频后，会与当前这首歌的歌词关联。</p>
      )}
      <div className="settings-actions">
        <button className="secondary-button" type="button" onClick={() => fileInputRef.current?.click()} disabled={isBinding}>
          {isBinding ? <Loader2 className="spin" size={17} /> : <Upload size={17} />}
          <span>{song.localAudioFileName ? "更换音频" : "选择音频"}</span>
        </button>
        <button className="secondary-button danger-text" type="button" onClick={handleRemoveAudio} disabled={!song.localAudioFileName || isBinding}>
          <Trash2 size={17} />
          <span>移除</span>
        </button>
      </div>
      <div className="settings-actions audio-download-actions">
        <button className="secondary-button" type="button" onClick={() => void copySongTitle()} aria-label={didCopySongTitle ? "已复制歌名" : "复制歌名"}>
          {didCopySongTitle ? <Check size={17} /> : <Copy size={17} />}
          <span>{didCopySongTitle ? "已复制" : "复制歌名"}</span>
        </button>
        <button className="secondary-button" type="button" onClick={openWebDownloadPage} aria-label="在浏览器打开歌曲下载页面">
          <ExternalLink size={17} />
          <span>网页下载</span>
        </button>
      </div>
      <div className="audio-offset-control">
        <span>音轨校准</span>
        <button className="icon-button muted" type="button" onClick={() => updateOffset(audioOffsetSeconds - 0.1)} disabled={!hasLocalAudio} aria-label="音轨提前 0.1 秒">
          <Minus size={16} />
        </button>
        <label>
          <span className="sr-only">音轨偏移秒数</span>
          <input
            type="number"
            min="-10"
            max="10"
            step="0.1"
            value={offsetInput}
            disabled={!hasLocalAudio}
            onChange={(event) => setOffsetInput(event.target.value)}
            onBlur={commitOffsetInput}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.currentTarget.blur();
              }
            }}
          />
        </label>
        <span>秒</span>
        <button className="icon-button muted" type="button" onClick={() => updateOffset(audioOffsetSeconds + 0.1)} disabled={!hasLocalAudio} aria-label="音轨延后 0.1 秒">
          <Plus size={16} />
        </button>
        <button className="icon-button muted" type="button" onClick={() => updateOffset(0)} disabled={!hasLocalAudio} aria-label="重置音轨校准">
          <RotateCcw size={16} />
        </button>
      </div>
      <input ref={fileInputRef} className="hidden-input" type="file" accept="audio/*,.mp3,.m4a,.wav,.aac,.aiff,.caf" onChange={handleFileChange} />
    </section>
  );
}

interface SongDetailPageProps {
  song: Song;
  saved: boolean;
  onBack: () => void;
  onToggleSaved: () => void;
  onOpenLine: (song: Song, lineID?: string) => void;
  onBindLocalAudio: (song: Song, file: File) => Promise<void>;
  onRemoveLocalAudio: (song: Song) => Promise<void>;
  onUpdateLocalAudioOffset: (song: Song, offsetSeconds: number) => void;
}

function SongDetailPage({ song, saved, onBack, onToggleSaved, onOpenLine, onBindLocalAudio, onRemoveLocalAudio, onUpdateLocalAudioOffset }: SongDetailPageProps) {
  return (
    <div className="workspace detail-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>返回</span>
      </button>
      <SongDetail
        song={song}
        saved={saved}
        onToggleSaved={onToggleSaved}
        onOpenLine={onOpenLine}
        onBindLocalAudio={onBindLocalAudio}
        onRemoveLocalAudio={onRemoveLocalAudio}
        onUpdateLocalAudioOffset={onUpdateLocalAudioOffset}
      />
    </div>
  );
}

interface LineStudyPanelProps {
  song: Song;
  line: LyricLine;
  savedWords: VocabularyItem[];
  isSongSaved: boolean;
  onLineChange: (lineID: string) => void;
  onToggleSong: () => void;
  onToggleWord: (word: VocabularyItem) => void;
}

interface LineStudyPageProps extends LineStudyPanelProps {
  onBack: () => void;
}

function LineStudyPage({ onBack, ...panelProps }: LineStudyPageProps) {
  return (
    <div className="workspace detail-page line-study-page">
      <button className="back-button" type="button" onClick={onBack}>
        <ArrowLeft size={18} />
        <span>返回歌曲</span>
      </button>
      <LineStudyPanel {...panelProps} />
    </div>
  );
}

function LineStudyPanel({ song, line, savedWords, isSongSaved, onLineChange, onToggleSong, onToggleWord }: LineStudyPanelProps) {
  const [translation, setTranslation] = useState<string | null>(() => line.translation || (getCachedTranslation(line.id) ?? null));
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationError, setTranslationError] = useState<string | null>(null);

  useEffect(() => {
    setTranslation(line.translation || (getCachedTranslation(line.id) ?? null));
    setTranslationError(null);
    setIsTranslating(false);
  }, [line.id, line.translation]);

  const lineIndex = song.lyricLines.findIndex((item) => item.id === line.id);
  const nextLine = lineIndex >= 0 ? song.lyricLines[lineIndex + 1] : undefined;

  async function loadTranslation() {
    setIsTranslating(true);
    setTranslationError(null);
    try {
      const translated = await translateLine(line.id, line.japanese);
      setTranslation(translated);
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : "翻译失败");
    } finally {
      setIsTranslating(false);
    }
  }

  return (
    <div className="line-study">
      <div className="panel-header">
        <Artwork song={song} size="small" />
        <div>
          <p>{lineIndex >= 0 ? `第 ${lineIndex + 1} / ${song.lyricLines.length} 句` : "分句学习"}</p>
          <h2>{song.title}</h2>
        </div>
        <button className={`icon-button ${isSongSaved ? "saved" : ""}`} type="button" onClick={onToggleSong} aria-label={isSongSaved ? "取消保存歌曲" : "保存歌曲"}>
          <Star size={18} fill={isSongSaved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="line-main">
        <p className="japanese-line">{line.japanese}</p>
        {line.kana && <p className="kana-line">{line.kana}</p>}
        <div className="voice-actions">
          <button className="secondary-button" type="button" onClick={() => speakJapanese(line.japanese, 0.62)}>
            <Volume2 size={17} />
            <span>慢速</span>
          </button>
          <button className="secondary-button" type="button" onClick={() => speakJapanese(line.japanese, 0.86)}>
            <Play size={17} />
            <span>自然</span>
          </button>
        </div>
      </div>

      <section className="study-section">
        <SectionTitle icon={<Languages size={17} />} title="整句翻译" />
        {translation ? <p className="translation-text">{translation}</p> : <p className="muted-text">当前歌词没有自带译文。</p>}
        {!line.translation && (
          <button className="secondary-button" type="button" onClick={loadTranslation} disabled={isTranslating}>
            {isTranslating ? <Loader2 className="spin" size={17} /> : <Download size={17} />}
            <span>{translation ? "重新翻译" : "机器翻译"}</span>
          </button>
        )}
        {translationError && <p className="error-text">{translationError}</p>}
      </section>

      <section className="study-section">
        <SectionTitle icon={<Sparkles size={17} />} title="语法点" />
        <GrammarPromptCard prompt={makeGrammarPrompt(song, line, translation)} />
        <div className="grammar-stack">
          {line.grammarNotes.map((note) => (
            <article className="grammar-card" key={note.id}>
              <strong>{note.pattern}</strong>
              <p>{note.explanation}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="study-section">
        <SectionTitle icon={<BookOpen size={17} />} title="词卡" />
        <div className="vocab-stack">
          {line.vocabulary.map((word) => {
            const saved = savedWords.some((item) => item.id === word.id);
            return (
              <article className="mini-word" key={word.id}>
                <div>
                  <strong>{word.word}</strong>
                  <span>{word.reading}</span>
                  <p>{word.meaning}</p>
                </div>
                <div className="mini-word-actions">
                  <button className="icon-button" type="button" onClick={() => speakJapanese(word.word, 0.8)} aria-label={`朗读 ${word.word}`}>
                    <Volume2 size={17} />
                  </button>
                  <button className={`icon-button ${saved ? "saved" : ""}`} type="button" onClick={() => onToggleWord(word)} aria-label={saved ? "取消收藏生词" : "收藏生词"}>
                    {saved ? <Check size={17} /> : <Plus size={17} />}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {nextLine && (
        <button className="next-line-button" type="button" onClick={() => onLineChange(nextLine.id)}>
          <span>下一句</span>
          <ChevronRight size={18} />
        </button>
      )}
    </div>
  );
}

function GrammarPromptCard({ prompt }: { prompt: string }) {
  const [didCopy, setDidCopy] = useState(false);

  async function copyPrompt() {
    try {
      await copyTextToClipboard(prompt);
      setDidCopy(true);
      window.setTimeout(() => setDidCopy(false), 2000);
    } catch {
      setDidCopy(false);
    }
  }

  return (
    <article className="grammar-prompt-card">
      <div className="grammar-prompt-header">
        <div className="grammar-prompt-title">
          <strong>歌词解析 Prompt</strong>
          <span>当前句子</span>
          <span className="grammar-prompt-note">可直接复制到豆包或 DeepSeek 中</span>
        </div>
        <div className="grammar-prompt-actions">
          <button className="secondary-button" type="button" onClick={() => void copyPrompt()}>
            {didCopy ? <Check size={17} /> : <Copy size={17} />}
            <span>{didCopy ? "已复制" : "复制 Prompt"}</span>
          </button>
        </div>
      </div>
      <pre className="grammar-prompt-text">{prompt}</pre>
    </article>
  );
}

function NavButton({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={`nav-button ${active ? "is-active" : ""}`} type="button" onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}

function WorkspaceHeader({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <header className="workspace-header">
      <div className="header-icon">{icon}</div>
      <div>
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
    </header>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <h3 className="section-title">
      {icon}
      <span>{title}</span>
    </h3>
  );
}

function EmptyState({ icon, title, description, actionLabel, onAction }: { icon: React.ReactNode; title: string; description: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <strong>{title}</strong>
      <p>{description}</p>
      {actionLabel && onAction && (
        <button className="primary-button" type="button" onClick={onAction}>
          <Upload size={17} />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
}

function Artwork({ song, size }: { song: Song; size: "small" | "large" }) {
  return (
    <span className={`artwork artwork-${size}`} style={gradientStyle(song)}>
      <Mic2 size={size === "large" ? 32 : 18} />
    </span>
  );
}

function songMatches(song: Song, query: string): boolean {
  const haystack = [
    song.title,
    song.artist,
    song.level,
    song.summary,
    ...song.lyricLines.flatMap((line) => [
      line.japanese,
      line.kana,
      line.translation,
      ...line.vocabulary.flatMap((word) => [word.word, word.reading, word.meaning])
    ])
  ].join(" ");
  return haystack.toLocaleLowerCase().includes(query.toLocaleLowerCase());
}

function mergeSongs(onlineSongs: Song[], localSongs: Song[]): Song[] {
  const seen = new Set<string>();
  const merged: Song[] = [];

  for (const song of [...onlineSongs, ...localSongs]) {
    const key = `${song.title.toLocaleLowerCase()}|${song.artist.toLocaleLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    merged.push(song);
  }

  return merged;
}

function findActiveLyricLine(lines: LyricLine[], currentTime: number): LyricLine | null {
  let activeLine: LyricLine | null = null;
  for (const line of lines) {
    if (line.startTime <= currentTime + 0.15) {
      activeLine = line;
      continue;
    }
    break;
  }
  return activeLine;
}

function getLyricLineEndTime(song: Song, line: LyricLine, audioOffsetSeconds: number, audioDuration: number | null, startTime: number): number {
  const lineIndex = song.lyricLines.findIndex((item) => item.id === line.id);
  const nextLine = lineIndex >= 0 ? song.lyricLines[lineIndex + 1] : undefined;
  const rawEndTime = nextLine ? nextLine.startTime + audioOffsetSeconds : audioDuration ?? song.duration + audioOffsetSeconds;
  const maxEndTime = audioDuration ?? Math.max(rawEndTime, startTime + 0.5);
  return Math.max(startTime + 0.05, Math.min(rawEndTime, maxEndTime));
}

function normalizeAudioOffset(offsetSeconds: number): number {
  if (!Number.isFinite(offsetSeconds)) {
    return 0;
  }
  const clampedOffset = Math.min(10, Math.max(-10, offsetSeconds));
  return Math.round(clampedOffset * 10) / 10;
}

function formatAudioOffsetInput(offsetSeconds: number): string {
  return normalizeAudioOffset(offsetSeconds).toFixed(1);
}

function isVocabularyLearned(word: VocabularyItem): boolean {
  return Boolean(word.learnedAt);
}

function formatVocabularyProgress(word: VocabularyItem): string {
  const statusText = isVocabularyLearned(word) ? "已学过" : "未学";
  const reviewText = word.reviewCount ? `练习 ${word.reviewCount} 次` : "未练习";
  const lastStudiedText = word.lastStudiedAt ? ` · ${formatShortDate(word.lastStudiedAt)}` : "";
  return `${statusText} · ${reviewText}${lastStudiedText}`;
}

function makeGrammarPrompt(song: Song, line: LyricLine, translation?: string | null): string {
  const kanaPart = line.kana ? `\n假名：${line.kana}` : "";
  const translationText = translation || line.translation;
  const translationPart = translationText ? `\n参考中文：${translationText}` : "";

  return `你是一位面向中文母语者的日语老师，擅长用歌词讲解 N5-N4 日语语法。请准确但简洁，不要编造歌曲背景。\n\n请帮我解读下面这句日语歌词的语法。\n\n歌曲：${song.title}\n歌手：${song.artist}\n原文：${line.japanese}${kanaPart}${translationPart}\n\n我的诉求：\n- 说明句子整体意思和自然中文翻译。\n- 拆解句子结构，解释助词、动词变形、时态、语气和省略成分。\n- 指出歌词里不适合直译的表达，并给出更自然的理解。\n- 按日语学习者能看懂的方式说明。\n- 最后给 2 个相似例句。\n\n请按下面结构输出：\n【整体意思】\n【句子结构】\n【语法点】\n【歌词表达】\n【相似例句】`;
}

function formatShortDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "最近更新";
  }
  return date.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" });
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const didCopy = document.execCommand("copy");
    if (!didCopy) {
      throw new Error("copy command failed");
    }
  } finally {
    textarea.remove();
  }
}

function gradientStyle(song: Song): React.CSSProperties {
  return {
    "--tint-start": song.tintStartHex,
    "--tint-end": song.tintEndHex
  } as React.CSSProperties;
}

function formatTime(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safe / 60);
  const rest = String(safe % 60).padStart(2, "0");
  return `${minutes}:${rest}`;
}

interface StudyDataPackage {
  version?: number;
  exportedAt?: string;
  savedSongs?: Song[];
  savedWords?: VocabularyItem[];
  translations?: Record<string, string>;
}
