const hrvData = `HRV Assessment — Last 7 days
========================

2026-09-27:
 HRV Avg: 42 ms — Below normal
 Normal Range: 43 - 51 ms
 Baseline: 47 ms
2026-09-26:
 HRV Avg: 47 ms — Normal
 Normal Range: 44 - 52 ms
 Baseline: 48 ms
2026-09-25:
 HRV Avg: 43 ms — Below normal
 Normal Range: 44 - 52 ms
 Baseline: 48 ms
2026-09-24:
 HRV Avg: 43 ms — Below normal
 Normal Range: 45 - 53 ms
 Baseline: 49 ms
2026-09-23:
 HRV Avg: 53 ms — Normal
 Normal Range: 47 - 53 ms
 Baseline: 50 ms
2026-09-22:
 HRV Avg: 50 ms — Normal
 Normal Range: 46 - 52 ms
 Baseline: 49 ms
2026-09-21:
 HRV Avg: 47 ms — Normal
 Normal Range: 43 - 51 ms`;

function extractHrvHistory(str) {
  if (!str || typeof str !== 'string') return null;
  const history = [];
  const dateRegex = /(\d{4}-\d{2}-\d{2}):\s*[\s\S]*?HRV Avg:\s*(\d+)/g;
  const matches = [...str.matchAll(dateRegex)];
  
  for (const m of matches) {
    const dateStr = m[1];
    const val = Number(m[2]);
    const [_, mm, dd] = dateStr.split('-');
    history.push({ label: `${mm}/${dd}`, value: val });
  }
  return history.reverse();
}

console.log(extractHrvHistory(hrvData));
