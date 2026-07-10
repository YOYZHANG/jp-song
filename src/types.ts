export interface Song {
  id: string;
  title: string;
  artist: string;
  level: string;
  summary: string;
  duration: number;
  tintStartHex: string;
  tintEndHex: string;
  localAudioFileName?: string;
  localAudioMimeType?: string;
  localAudioOffsetSeconds?: number;
  lyricLines: LyricLine[];
}

export interface LyricLine {
  id: string;
  startTime: number;
  japanese: string;
  kana: string;
  translation: string;
  vocabulary: VocabularyItem[];
  grammarNotes: GrammarNote[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  partOfSpeech: string;
  example: string;
  learnedAt?: string;
  lastStudiedAt?: string;
  reviewCount?: number;
}

export interface GrammarNote {
  id: string;
  pattern: string;
  explanation: string;
  example: string;
}

export type TabID = "search" | "saved" | "vocabulary" | "settings";
