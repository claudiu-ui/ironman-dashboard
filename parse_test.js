const sleepData = `2026-09-27
Sleep Score: 89
Daily Sleep: 8h 44min (incl. naps)
Main Sleep (asleep): 8h 44min
Main Sleep Period (incl. awake): 9h 1min
Sleep metrics scope: daily
Deep Sleep Ratio: 13%
Light Sleep Ratio: 67%
REM Ratio: 17%`;

const hrvData = `2026-09-27:
 HRV Avg: 42 ms — Below normal
 Normal Range: 43 - 51 ms
 Baseline: 47 ms`;

const healthData = `--- 20260927 ---
Steps: 160 | Calories: 31 kcal | Exercise: 0 min
Stress: Avg 19
Sleep Summary:
 Total: 9h 1min | Deep: 1h 8min | Light: 6h 3min | REM: 1h 33min | Awake: 17 min`;

const rhrData = `2026-09-27: 56 bpm`;

function extractRegex(str, pattern, group = 1) {
  if (!str) return null;
  const m = str.match(pattern);
  return m ? Number(m[group]) : null;
}

const sleepScore = extractRegex(sleepData, /Sleep Score:\s*(\d+)/);
let sleepSecs = null;
const hm = sleepData.match(/Main Sleep \(asleep\):\s*(\d+)h\s*(\d+)min/);
if (hm) {
  sleepSecs = Number(hm[1]) * 3600 + Number(hm[2]) * 60;
} else if (sleepData.match(/Total:\s*(\d+)h\s*(\d+)min/)) {
  const m = sleepData.match(/Total:\s*(\d+)h\s*(\d+)min/);
  sleepSecs = Number(m[1]) * 3600 + Number(m[2]) * 60;
}

const hrv = extractRegex(hrvData, /HRV Avg:\s*(\d+)/);
const rhr = extractRegex(rhrData, /(\d+)\s*bpm/);
const steps = extractRegex(healthData, /Steps:\s*([\d,]+)/);
const stepsParsed = steps ? Number(String(steps).replace(/,/g, '')) : null;

// But match without group for steps is tricky if it has comma, let's use replace
const stepsMatch = healthData.match(/Steps:\s*([\d,]+)/);
const stepsClean = stepsMatch ? Number(stepsMatch[1].replace(/,/g, '')) : null;

const calories = extractRegex(healthData, /Calories:\s*([\d,]+)/);
const calMatch = healthData.match(/Calories:\s*([\d,]+)/);
const calClean = calMatch ? Number(calMatch[1].replace(/,/g, '')) : null;

const stress = extractRegex(healthData, /Stress:\s*Avg\s*(\d+)/);

console.log({ sleepScore, sleepSecs, hrv, rhr, stepsClean, calClean, stress });
