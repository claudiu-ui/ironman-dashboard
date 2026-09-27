const text = '```json\n{"totalSleepSecs": 32400}\n```';
let data = text;
try { data = JSON.parse(text); } catch (e) {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/);
  if (match) {
    try { data = JSON.parse(match[1]); } catch (e) { data = text; }
  }
}
console.log(data);
