import type { GrammarNote, VocabularyItem } from "../types";

const dictionary: VocabularyItem[] = [
  item("dict-watashi", "私", "わたし", "我", "代词", "私は日本語を勉強します。"),
  item("dict-boku", "僕", "ぼく", "我，男性常用", "代词", "僕は歌が好きです。"),
  item("dict-kimi", "君", "きみ", "你", "代词", "君の声が聞こえます。"),
  item("dict-anata", "あなた", "あなた", "你", "代词", "あなたの歌が好きです。"),
  item("dict-minna", "みんな", "みんな", "大家，所有人", "名词/副词", "みんなで歌います。"),
  item("dict-ai", "愛", "あい", "爱", "名词", "愛を歌にします。"),
  item("dict-koi", "恋", "こい", "恋爱", "名词", "恋の歌を聞きます。"),
  item("dict-yume", "夢", "ゆめ", "梦", "名词", "夢を見ました。"),
  item("dict-yoru", "夜", "よる", "夜晚", "名词", "夜に音楽を聞きます。"),
  item("dict-asa", "朝", "あさ", "早晨", "名词", "朝の空は明るいです。"),
  item("dict-densha", "電車", "でんしゃ", "电车", "名词", "電車で学校へ行きます。"),
  item("dict-machi", "街", "まち", "街道，城市", "名词", "この街は静かです。"),
  item("dict-mado", "窓", "まど", "窗户", "名词", "窓を開けます。"),
  item("dict-soto", "外", "そと", "外面", "名词", "外は寒いです。"),
  item("dict-sora", "空", "そら", "天空", "名词", "空が青いです。"),
  item("dict-ame", "雨", "あめ", "雨", "名词", "雨が降っています。"),
  item("dict-eki", "駅", "えき", "车站", "名词", "駅で待っています。"),
  item("dict-kaze", "風", "かぜ", "风", "名词", "風が強いです。"),
  item("dict-hana", "花", "はな", "花", "名词", "花が咲きます。"),
  item("dict-kokoro", "心", "こころ", "心", "名词", "心が温かいです。"),
  item("dict-koe", "声", "こえ", "声音", "名词", "声がきれいです。"),
  item("dict-namida", "涙", "なみだ", "眼泪", "名词", "涙が出ました。"),
  item("dict-egao", "笑顔", "えがお", "笑容", "名词", "笑顔を忘れないで。"),
  item("dict-sekai", "世界", "せかい", "世界", "名词", "世界は広いです。"),
  item("dict-mirai", "未来", "みらい", "未来", "名词", "未来を信じます。"),
  item("dict-kyou", "今日", "きょう", "今天", "名词", "今日は歌を聞きます。"),
  item("dict-ashita", "明日", "あした", "明天", "名词", "明日また会いましょう。"),
  item("dict-hoshi", "星", "ほし", "星星", "名词", "星が見えます。"),
  item("dict-tsuki", "月", "つき", "月亮", "名词", "月が明るいです。"),
  item("dict-hikari", "光", "ひかり", "光", "名词", "光が差しています。"),
  item("dict-kage", "影", "かげ", "影子", "名词", "影が長くなりました。"),
  item("dict-uta", "歌", "うた", "歌", "名词", "この歌が好きです。"),
  item("dict-ongaku", "音楽", "おんがく", "音乐", "名词", "音楽を聞きます。"),
  item("dict-kashi", "歌詞", "かし", "歌词", "名词", "歌詞を読みます。"),
  item("dict-kotoba", "言葉", "ことば", "词语，语言", "名词", "新しい言葉を覚えます。"),
  item("dict-toki", "時", "とき", "时候，时间", "名词", "その時、雨が降りました。"),
  item("dict-heya", "部屋", "へや", "房间", "名词", "部屋を掃除します。"),
  item("dict-kasa", "傘", "かさ", "伞", "名词", "傘を持っています。"),
  item("dict-futari", "二人", "ふたり", "两个人", "数量词", "二人で話します。"),
  item("dict-ichinichi", "一日", "いちにち", "一天", "名词", "一日中勉強しました。"),
  item("dict-melody", "メロディー", "メロディー", "旋律", "名词", "メロディーを覚えます。"),
  item("dict-mune", "胸", "むね", "胸口，心中", "名词", "胸がどきどきします。"),
  item("dict-ima", "今", "いま", "现在", "名词/副词", "今、歌を聞いています。"),
  item("dict-koko", "ここ", "ここ", "这里", "代词", "ここにいます。"),
  item("dict-ano", "あの", "あの", "那个", "连体词", "あの歌を聞きたいです。"),
  item("dict-kono", "この", "この", "这个", "连体词", "この歌が好きです。"),
  item("dict-sono", "その", "その", "那个", "连体词", "その本をください。"),
  item("dict-nani", "何", "なに", "什么", "疑问词", "何を聞きますか。"),
  item("dict-dare", "誰", "だれ", "谁", "疑问词", "誰と歌いますか。"),
  item("dict-doko", "どこ", "どこ", "哪里", "疑问词", "どこへ行きますか。"),
  item("dict-iku", "行く", "いく", "去", "动词", "駅へ行きます。"),
  item("dict-kuru", "来る", "くる", "来", "动词", "友だちが来ます。"),
  item("dict-miru", "見る", "みる", "看", "动词", "空を見ます。"),
  item("dict-kiku", "聞く", "きく", "听，询问", "动词", "音楽を聞きます。"),
  item("dict-yomu", "読む", "よむ", "读", "动词", "歌詞を読みます。"),
  item("dict-utau", "歌う", "うたう", "唱歌", "动词", "日本語で歌います。"),
  item("dict-noru", "乗る", "のる", "乘坐", "动词", "電車に乗ります。"),
  item("dict-furu", "降る", "ふる", "下雨，下雪", "动词", "雨が降っています。"),
  item("dict-shiru", "知る", "しる", "知道", "动词", "答えを知っています。"),
  item("dict-omou", "思う", "おもう", "想，认为", "动词", "いい歌だと思います。"),
  item("dict-suki", "好き", "すき", "喜欢", "な形容词", "日本語の歌が好きです。"),
  item("dict-iru", "いる", "いる", "有，在", "动词", "ここにいます。"),
  item("dict-aru", "ある", "ある", "有，存在", "动词", "机の上に本があります。"),
  item("dict-naru", "なる", "なる", "变成", "动词", "上手になります。"),
  item("dict-matsu", "待つ", "まつ", "等待", "动词", "駅で待っています。"),
  item("dict-aruku", "歩く", "あるく", "走路", "动词", "道を歩きます。"),
  item("dict-shimau", "しまう", "しまう", "收起，结束，做完", "动词", "本をかばんにしまいます。"),
  item("dict-wakeru", "分ける", "わける", "分，分享", "动词", "ケーキを分けます。"),
  item("dict-wasureru", "忘れる", "わすれる", "忘记", "动词", "言葉を忘れました。"),
  item("dict-oboeru", "覚える", "おぼえる", "记住", "动词", "歌詞を覚えます。"),
  item("dict-au", "会う", "あう", "见面", "动词", "明日会いましょう。"),
  item("dict-shinjiru", "信じる", "しんじる", "相信", "动词", "未来を信じます。"),
  item("dict-warau", "笑う", "わらう", "笑", "动词", "友だちと笑います。"),
  item("dict-chiisana", "小さな", "ちいさな", "小的", "连体词", "小さな店があります。"),
  item("dict-chiisai", "小さい", "ちいさい", "小的", "い形容词", "小さい声で話します。"),
  item("dict-nagai", "長い", "ながい", "长的", "い形容词", "長い道を歩きます。"),
  item("dict-akarui", "明るい", "あかるい", "明亮的", "い形容词", "部屋が明るいです。"),
  item("dict-yukkuri", "ゆっくり", "ゆっくり", "慢慢地", "副词", "ゆっくり話してください。"),
  item("dict-sukoshizutsu", "少しずつ", "すこしずつ", "一点一点地", "副词", "少しずつ上手になります。"),
  item("dict-nandomo", "何度も", "なんども", "很多次", "副词", "何度も聞きます。"),
  item("dict-mitai", "みたい", "みたい", "像……一样", "表达", "夢みたいです。")
];

const particles: Record<string, [string, string]> = {
  "は": ["话题助词", "提示话题，常译作“至于……”。"],
  "が": ["主格助词", "标记主语或强调对象。"],
  "を": ["宾格助词", "标记动作的对象。"],
  "に": ["格助词", "表示时间、位置、方向或间接对象。"],
  "へ": ["方向助词", "表示移动方向，读作「え」。"],
  "で": ["格助词", "表示动作发生的地点、方式或手段。"],
  "の": ["连体助词", "表示所属、修饰或说明关系。"],
  "も": ["副助词", "表示“也、连……也”。"],
  "と": ["格助词", "表示“和”、引用或共同动作对象。"],
  "か": ["终助词", "表示疑问或不确定。"],
  "ね": ["终助词", "表示确认、感叹或寻求共鸣。"],
  "よ": ["终助词", "提示或强调说话人的判断。"],
  "て": ["接续助词", "连接动作或构成て形表达。"],
  "た": ["助动词", "表示过去或完成。"],
  "です": ["礼貌判断", "礼貌地表示判断或状态。"],
  "ます": ["礼貌助动词", "构成礼貌动词形式。"],
  "から": ["接续助词", "表示原因、理由或起点。"],
  "まで": ["副助词", "表示终点或范围。"],
  "だけ": ["副助词", "表示限定，意思是“只有”。"],
  "でも": ["复合助词", "表示让步或举例。"],
  "ても": ["接续助词", "表示让步条件。"],
  "なら": ["假定表达", "表示“如果是……”。"]
};

export function analyzeVocabulary(text: string): VocabularyItem[] {
  return tokenize(text).map((token, index) => vocabularyItemFor(token, index, text));
}

export function analyzeGrammar(text: string): GrammarNote[] {
  const notes: GrammarNote[] = [];

  addGrammar(notes, text.includes("ても") || text.includes("でも"), "grammar-temo", "Vても / Nでも", "表示让步条件，意思接近“即使……也……”。", text);
  addGrammar(notes, text.includes("ている") || text.includes("でいる"), "grammar-teiru", "Vている", "表示动作正在进行，或结果状态持续。", text);
  addGrammar(notes, text.includes("から"), "grammar-kara", "普通形 + から", "表示原因或理由，意思是“因为……”。", text);
  addGrammar(notes, text.includes("なら"), "grammar-nara", "名词/普通形 + なら", "表示假定、承接话题，意思接近“如果是……”。", text);
  addGrammar(notes, text.includes("たい"), "grammar-tai", "Vます形去ます + たい", "表示愿望，意思是“想要做……”。", text);
  addGrammar(notes, text.includes("ない"), "grammar-nai", "Vない", "动词ない形表示否定，意思是“不……”。", text);
  addGrammar(notes, text.includes("みたい"), "grammar-mitai", "名词 + みたい", "表示比喻或推测，意思是“像……一样”。", text);
  addGrammar(notes, text.includes("だけ"), "grammar-dake", "名词/普通形 + だけ", "表示限定，意思是“只有、仅仅”。", text);
  addGrammar(notes, text.includes("まで"), "grammar-made", "名词 + まで", "表示终点或范围，意思是“到……为止”。", text);
  addGrammar(notes, text.includes("ながら"), "grammar-nagara", "Vます形去ます + ながら", "表示两个动作同时进行，意思是“一边……一边……”。", text);
  addGrammar(notes, text.includes("のに"), "grammar-noni", "普通形 + のに", "表示逆接，意思接近“明明……却……”。", text);

  if (notes.length === 0) {
    notes.push({
      id: `grammar-basic-${stableID(text)}`,
      pattern: "歌词句子整体理解",
      explanation: "这句暂未匹配到固定语法点，可以先通过朗读把语感和常见词记下来。",
      example: text
    });
  }

  return notes.slice(0, 3);
}

function item(id: string, word: string, reading: string, meaning: string, partOfSpeech: string, example: string): VocabularyItem {
  return { id, word, reading, meaning, partOfSpeech, example };
}

function vocabularyItemFor(token: string, index: number, sentence: string): VocabularyItem {
  const exact = dictionary.find((entry) => entry.word === token || entry.reading === token);
  const normalized = exact ?? normalizedDictionaryItem(token);
  const particle = particles[token];
  const id = `word-${index}-${stableID(sentence + token)}`;

  if (normalized) {
    return { ...normalized, id };
  }

  if (particle) {
    return {
      id,
      word: token,
      reading: token,
      meaning: particle[1],
      partOfSpeech: particle[0],
      example: sentence
    };
  }

  return {
    id,
    word: token,
    reading: token,
    meaning: "待补充释义",
    partOfSpeech: inferredPartOfSpeech(token),
    example: sentence
  };
}

function normalizedDictionaryItem(token: string): VocabularyItem | undefined {
  for (const candidate of normalizedCandidates(token)) {
    const match = dictionary.find((entry) => entry.word === candidate || entry.reading === candidate);
    if (match) {
      return match;
    }
  }
  return undefined;
}

function normalizedCandidates(token: string): string[] {
  const candidates = [token];
  const suffixMap: Array<[string, string]> = [
    ["った", "る"],
    ["って", "る"],
    ["んで", "む"],
    ["んだ", "む"],
    ["いた", "く"],
    ["いて", "く"],
    ["いで", "ぐ"],
    ["した", "する"],
    ["して", "する"],
    ["したい", "する"],
    ["したく", "する"],
    ["ない", "る"],
    ["たい", "る"],
    ["ます", "る"],
    ["ました", "る"],
    ["られる", "る"],
    ["れる", "る"],
    ["ぎた", "ぎる"],
    ["ぎて", "ぎる"],
    ["よう", "る"],
    ["おう", "う"]
  ];

  for (const [suffix, replacement] of suffixMap) {
    if (token.endsWith(suffix) && token.length > suffix.length) {
      candidates.push(token.slice(0, -suffix.length) + replacement);
    }
  }

  if (token.endsWith("く")) {
    candidates.push(`${token.slice(0, -1)}い`);
  }

  return candidates;
}

function tokenize(text: string): string[] {
  const Segmenter = (Intl as typeof Intl & {
    Segmenter?: new (locale: string, options: { granularity: "word" }) => {
      segment: (value: string) => Iterable<{ segment: string; isWordLike?: boolean }>;
    };
  }).Segmenter;

  if (Segmenter) {
    const segmenter = new Segmenter("ja", { granularity: "word" });
    const tokens = Array.from(segmenter.segment(text))
      .filter((part) => part.isWordLike !== false)
      .map((part) => part.segment.trim())
      .filter((token) => token && !isPunctuationOnly(token));

    if (tokens.length > 0) {
      return tokens;
    }
  }

  return text
    .split(/[\s、。！？,.!?「」『』（）()[\]{}]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function inferredPartOfSpeech(token: string): string {
  if (particles[token]) {
    return "助词";
  }
  if (token.endsWith("い")) {
    return "い形容词/词形";
  }
  if (/[るうくすむ]$/u.test(token)) {
    return "动词/词形";
  }
  if (/^[A-Za-z0-9'’-]+$/u.test(token)) {
    return "外来语/英文";
  }
  return "词语";
}

function isPunctuationOnly(token: string): boolean {
  return /^[\p{P}\p{S}]+$/u.test(token);
}

function addGrammar(notes: GrammarNote[], condition: boolean, id: string, pattern: string, explanation: string, example: string): void {
  if (!condition) {
    return;
  }

  notes.push({
    id: `${id}-${stableID(example)}`,
    pattern,
    explanation,
    example
  });
}

function stableID(text: string): string {
  let hash = 5381;
  for (const char of text) {
    hash = (hash * 33 + char.codePointAt(0)!) >>> 0;
  }
  return hash.toString(16);
}
