export function speakJapanese(text: string, rate = 0.8): void {
  if (!("speechSynthesis" in window)) {
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
