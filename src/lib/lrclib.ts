import type { LyricLine, Song } from "../types";
import { analyzeGrammar, analyzeVocabulary } from "./studyAnalyzer";

interface LRCLIBLyricsRecord {
  id: number;
  name?: string;
  trackName: string;
  artistName: string;
  albumName?: string;
  duration?: number;
  instrumental: boolean;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
}

export async function searchLRCLIB(query: string, signal?: AbortSignal): Promise<Song[]> {
  const url = new URL("https://lrclib.net/api/search");
  url.searchParams.set("q", query);

  const response = await fetch(url, {
    signal,
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`LRCLIB 返回 ${response.status}`);
  }

  const records = (await response.json()) as LRCLIBLyricsRecord[];

  return records
    .sort((left, right) => {
      if (containsJapaneseLyrics(left) !== containsJapaneseLyrics(right)) {
        return containsJapaneseLyrics(left) ? -1 : 1;
      }
      return left.id - right.id;
    })
    .map(recordToSong)
    .filter((song): song is Song => Boolean(song));
}

function recordToSong(record: LRCLIBLyricsRecord): Song | null {
  if (record.instrumental || !containsJapaneseLyrics(record)) {
    return null;
  }

  const lyricLines = makeLyricLines(record);
  if (lyricLines.length === 0) {
    return null;
  }

  const [tintStartHex, tintEndHex] = colorsFor(`${record.trackName}|${record.artistName}`);
  const lyricType = record.syncedLyrics ? "同步歌词" : "普通歌词";
  const albumText = record.albumName ? ` · ${record.albumName}` : "";

  return {
    id: `lrclib-${record.id}`,
    title: record.trackName,
    artist: record.artistName,
    level: "在线",
    summary: `LRCLIB ${lyricType}${albumText}`,
    duration: record.duration ?? (lyricLines[lyricLines.length - 1]?.startTime ?? 55) + 5,
    tintStartHex,
    tintEndHex,
    lyricLines
  };
}

function makeLyricLines(record: LRCLIBLyricsRecord): LyricLine[] {
  const synced = parseSyncedLyrics(record.syncedLyrics ?? "", `lrclib-${record.id}`);
  if (synced.length > 0) {
    return synced;
  }

  return parsePlainLyrics(record.plainLyrics ?? "", record.duration ?? 60, `lrclib-${record.id}`);
}

function parseSyncedLyrics(lyrics: string, fallbackPrefix: string): LyricLine[] {
  return lyrics
    .split(/\r?\n/u)
    .map((rawLine, index) => parseLRCLine(rawLine, index, fallbackPrefix))
    .filter((line): line is LyricLine => Boolean(line));
}

function parsePlainLyrics(lyrics: string, duration: number, fallbackPrefix: string): LyricLine[] {
  const textLines = lyrics
    .split(/\r?\n/u)
    .map((text) => text.trim())
    .filter(Boolean);

  if (textLines.length === 0) {
    return [];
  }

  const spacing = Math.max(duration / textLines.length, 3);
  return textLines.map((text, index) => makeLine(`${fallbackPrefix}-plain-${index}`, index * spacing, text));
}

function parseLRCLine(rawLine: string, index: number, fallbackPrefix: string): LyricLine | null {
  const matches = Array.from(rawLine.matchAll(/\[(\d+(?:\.\d+)?):(\d+(?:\.\d+)?)\]/gu));
  if (matches.length === 0) {
    return null;
  }

  const text = rawLine.replace(/(?:\[(?:\d+(?:\.\d+)?):(?:\d+(?:\.\d+)?)\])+/gu, "").trim();
  if (!text) {
    return null;
  }

  const first = matches[0];
  const startTime = Number(first[1]) * 60 + Number(first[2]);
  return makeLine(`${fallbackPrefix}-sync-${index}`, startTime, text);
}

function makeLine(id: string, startTime: number, text: string): LyricLine {
  return {
    id,
    startTime,
    japanese: text,
    kana: "",
    translation: "",
    vocabulary: analyzeVocabulary(text),
    grammarNotes: analyzeGrammar(text)
  };
}

function containsJapaneseLyrics(record: LRCLIBLyricsRecord): boolean {
  const text = `${record.syncedLyrics ?? ""}\n${record.plainLyrics ?? ""}`;
  return /[\u3040-\u30ff\u3400-\u9fff]/u.test(text);
}

function colorsFor(seed: string): [string, string] {
  const palettes: Array<[string, string]> = [
    ["#2F80ED", "#27AE60"],
    ["#EB5757", "#F2994A"],
    ["#00B8D4", "#6C5CE7"],
    ["#00875A", "#0052CC"],
    ["#C44569", "#546DE5"],
    ["#2D3436", "#0984E3"]
  ];
  let hash = 5381;
  for (const char of seed) {
    hash = (hash * 33 + char.codePointAt(0)!) >>> 0;
  }
  return palettes[hash % palettes.length];
}
