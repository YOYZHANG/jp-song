import type { LyricLine, Song } from "../types";
import { analyzeGrammar, analyzeVocabulary } from "../lib/studyAnalyzer";

export const sampleSongs: Song[] = [
  {
    id: "morning-train",
    title: "朝の電車",
    artist: "Nihongo Demo Band",
    level: "N5-N4",
    summary: "通勤路上的城市、天空和一天的开始。",
    duration: 54,
    tintStartHex: "#2F80ED",
    tintEndHex: "#27AE60",
    lyricLines: [
      line("morning-train-1", 0, "朝の電車に乗って、街へ行く。", "あさのでんしゃにのって、まちへいく。", "我坐上早晨的电车，去往街上。"),
      line("morning-train-2", 8, "窓の外で空が少しずつ明るくなる。", "まどのそとでそらがすこしずつあかるくなる。", "窗外的天空一点一点变亮。"),
      line("morning-train-3", 18, "知らない言葉も、歌えば覚えられる。", "しらないことばも、うたえばおぼえられる。", "不认识的词，只要唱起来也能记住。"),
      line("morning-train-4", 30, "今日のメロディーを胸にしまって歩こう。", "きょうのメロディーをむねにしまってあるこう。", "把今天的旋律收在心里，向前走吧。")
    ]
  },
  {
    id: "rainy-promise",
    title: "雨の日の約束",
    artist: "Sora Class",
    level: "N4",
    summary: "在雨天练习约定、理由和心情表达。",
    duration: 48,
    tintStartHex: "#6C5CE7",
    tintEndHex: "#00B8D4",
    lyricLines: [
      line("rainy-promise-1", 0, "雨が降っても、駅で待っている。", "あめがふっても、えきでまっている。", "即使下雨，我也会在车站等着。"),
      line("rainy-promise-2", 12, "小さな傘を二人で分けた。", "ちいさなかさをふたりでわけた。", "我们两个人共用一把小伞。"),
      line("rainy-promise-3", 24, "会えたから、長い一日も好きになった。", "あえたから、ながいいちにちもすきになった。", "因为见到了你，漫长的一天也变得喜欢了。")
    ]
  },
  {
    id: "small-light",
    title: "小さな光",
    artist: "Kana Notes",
    level: "N5",
    summary: "适合入门的名词、形容词和基本助词练习。",
    duration: 44,
    tintStartHex: "#F2994A",
    tintEndHex: "#EB5757",
    lyricLines: [
      line("small-light-1", 0, "部屋に小さな光がある。", "へやにちいさなひかりがある。", "房间里有一束小小的光。"),
      line("small-light-2", 10, "その光は君の声みたいだ。", "そのひかりはきみのこえみたいだ。", "那束光像你的声音一样。"),
      line("small-light-3", 22, "ゆっくり読んで、何度も歌う。", "ゆっくりよんで、なんどもうたう。", "慢慢读，一遍又一遍地唱。")
    ]
  }
];

function line(id: string, startTime: number, japanese: string, kana: string, translation: string): LyricLine {
  return {
    id,
    startTime,
    japanese,
    kana,
    translation,
    vocabulary: analyzeVocabulary(japanese),
    grammarNotes: analyzeGrammar(japanese)
  };
}
