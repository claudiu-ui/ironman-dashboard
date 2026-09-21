// ============================================
// Fitness Metrics Engine
// CTL / ATL / TSB — Real Data or Local Fallback
// ============================================
import { storage } from './storage.js';
import { PLAN_START } from './data.js';

// ── TSS Estimation per sport type ───────────────────────────────────────────
// TSS = (duration_sec × NP × IF) / (FTP × 3600) × 100
// For triathlon athletes without power meters we use HR-based estimates:
//   swim: ~60 TSS/hr at moderate effort, scales with RPE
//   run:  ~75 TSS/hr (RPE 5), up to 120+ for hard efforts
//   bike: ~55 TSS/hr easy Z2, up to 100+ hard
//   conditioning/gym: ~40 TSS/hr
function estimateTSS(workout) {
  const dur = parseFloat(workout.duration) || 0; // minutes
  const rpe = parseFloat(workout.rpe) || 5;
  const hrs = dur / 60;

  // RPE intensity factor: rpe 1-10 → 0.5-1.2
  const intensityFactor = 0.5 + (rpe / 10) * 0.7;

  const basePerHour = {
    swim: 65,
    run: 75,
    bike: 60,
    conditioning: 50,
    gym: 40,
    other: 40,
  };

  const base = basePerHour[workout.type] || 40;

  // If we have actual HR data, use Trimp-derived estimate
  if (workout.hr && workout.hr > 0) {
    const hrMax = 194; // Claudiu's HRmax
    const hrRest = 50;
    const hrReserve = hrMax - hrRest;
    const hrRatio = (workout.hr - hrRest) / hrReserve;
    // TRIMP = duration × hrRatio × 0.64 × e^(1.92 × hrRatio)
    const trimp = hrs * 60 * hrRatio * 0.64 * Math.exp(1.92 * hrRatio);
    return Math.round(trimp);
  }

  return Math.round(base * hrs * intensityFactor);
}

// ── Exponential smoothing for CTL/ATL ────────────────────────────────────────
// CTL: 42-day time constant (chronic)
// ATL: 7-day time constant (acute)
const CTL_TC = 42;
const ATL_TC = 7;
const CTL_DECAY = Math.exp(-1 / CTL_TC); // ~0.9764
const ATL_DECAY = Math.exp(-1 / ATL_TC); // ~0.8668

function computeLocalMetrics() {
  const allWorkouts = storage.get('workouts', {});
  const dates = Object.keys(allWorkouts).sort();

  if (dates.length === 0) return null;

  // Build daily TSS map
  const dailyTSS = {};
  for (const [date, logs] of Object.entries(allWorkouts)) {
    let tss = 0;
    (logs || []).forEach(w => {
      if (!w.isSkipped) tss += estimateTSS(w);
    });
    dailyTSS[date] = tss;
  }

  // Walk from first date to today, applying exponential smoothing
  const firstDate = new Date(dates[0]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let ctl = 30; // Starting point for an active athlete
  let atl = 30;
  const history = []; // { date, ctl, atl, tsb, tss }

  for (let d = new Date(firstDate); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split('T')[0];
    const tss = dailyTSS[key] || 0;

    ctl = ctl * CTL_DECAY + tss * (1 - CTL_DECAY);
    atl = atl * ATL_DECAY + tss * (1 - ATL_DECAY);
    const tsb = ctl - atl;

    history.push({ date: key, ctl: Math.round(ctl), atl: Math.round(atl), tsb: Math.round(tsb), tss });
  }

  const current = history[history.length - 1];
  const sevenDaysAgo = history[Math.max(0, history.length - 8)];
  const thirtyDaysAgo = history[Math.max(0, history.length - 31)];

  // Weekly TSS total
  const last7 = history.slice(-7);
  const weeklyTSS = last7.reduce((s, d) => s + d.tss, 0);
  const prev7 = history.slice(-14, -7);
  const prevWeeklyTSS = prev7.reduce((s, d) => s + d.tss, 0);

  // Sport-specific weekly volumes
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + 1); // Monday
  let weekSwim = 0, weekRun = 0, weekBike = 0, weekGym = 0, weekDuration = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const k = d.toISOString().split('T')[0];
    (allWorkouts[k] || []).forEach(w => {
      if (w.isSkipped) return;
      const dist = parseFloat(w.distance) || 0;
      const dur = parseFloat(w.duration) || 0;
      if (w.type === 'swim') weekSwim += dist;
      else if (w.type === 'run') weekRun += dist;
      else if (w.type === 'bike') weekBike += dist;
      else if (w.type === 'gym' || w.type === 'conditioning') weekGym += 1;
      weekDuration += dur;
    });
  }

  return {
    source: 'local',
    ctl: current.ctl,
    atl: current.atl,
    tsb: current.tsb,
    todayTSS: current.tss,
    weeklyTSS: Math.round(weeklyTSS),
    prevWeeklyTSS: Math.round(prevWeeklyTSS),
    ctlDelta: current.ctl - (sevenDaysAgo?.ctl || current.ctl),
    atlDelta: current.atl - (sevenDaysAgo?.atl || current.atl),
    tsbDelta: current.tsb - (sevenDaysAgo?.tsb || current.tsb),
    ctlMonthDelta: current.ctl - (thirtyDaysAgo?.ctl || current.ctl),
    history: history.slice(-90), // Last 90 days for charts
    weekSwim, weekRun, weekBike, weekGym,
    weekDuration: Math.round(weekDuration),
  };
}

// ── Intervals.icu Wellness API ───────────────────────────────────────────────
async function fetchIntervalsMetrics(athleteId, apiKey) {
  const oldest = new Date();
  oldest.setDate(oldest.getDate() - 60);
  const oldestIso = oldest.toISOString().split('T')[0];
  const newestIso = new Date().toISOString().split('T')[0];

  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa('API_KEY:' + apiKey));

  const url = `https://intervals.icu/api/v1/athlete/${athleteId}/wellness?oldest=${oldestIso}&newest=${newestIso}&cols=ctl,atl,rampRate,sportInfo`;

  const resp = await fetch(url, { headers });
  if (!resp.ok) throw new Error(`Intervals API error: ${resp.status}`);
  const data = await resp.json();

  if (!data || data.length === 0) throw new Error('No wellness data');

  // Sort by date descending, take latest entry with CTL data
  const sorted = [...data].sort((a, b) => b.id?.localeCompare(a.id) || 0);
  const latest = sorted.find(d => d.ctl != null) || sorted[0];
  const prev7 = sorted.find((d, i) => i >= 6 && d.ctl != null);
  const prev30 = sorted.find((d, i) => i >= 28 && d.ctl != null);

  const ctl = Math.round(latest.ctl || 0);
  const atl = Math.round(latest.atl || 0);
  const tsb = Math.round(ctl - atl);

  // Also fetch recent activities for weekly TSS
  const actUrl = `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldest.toISOString().split('T')[0]}&newest=${newestIso}&cols=icu_training_load,type,moving_time,distance`;
  const actResp = await fetch(actUrl, { headers });
  let weeklyTSS = 0, prevWeeklyTSS = 0;
  if (actResp.ok) {
    const acts = await actResp.json();
    const todayMs = Date.now();
    const weekMs = 7 * 86400000;
    (acts || []).forEach(a => {
      const ms = new Date(a.start_date_local).getTime();
      const tss = a.icu_training_load || 0;
      if (todayMs - ms < weekMs) weeklyTSS += tss;
      else if (todayMs - ms < 2 * weekMs) prevWeeklyTSS += tss;
    });
  }

  return {
    source: 'intervals',
    ctl,
    atl,
    tsb,
    todayTSS: 0,
    weeklyTSS: Math.round(weeklyTSS),
    prevWeeklyTSS: Math.round(prevWeeklyTSS),
    ctlDelta: ctl - Math.round(prev7?.ctl || ctl),
    atlDelta: atl - Math.round(prev7?.atl || atl),
    tsbDelta: tsb - Math.round((prev7?.ctl || ctl) - (prev7?.atl || atl)),
    ctlMonthDelta: ctl - Math.round(prev30?.ctl || ctl),
    rampRate: latest.rampRate || null,
    history: sorted.slice(0, 90).reverse().map(d => ({
      date: d.id,
      ctl: Math.round(d.ctl || 0),
      atl: Math.round(d.atl || 0),
      tsb: Math.round((d.ctl || 0) - (d.atl || 0)),
    })),
  };
}

// ── Main export ────────────────────────────────────────────────────────────
const CACHE_KEY = 'fitnessMetricsCache';
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

export async function getFitnessMetrics(forceRefresh = false) {
  const { athleteId, apiKey } = storage.getIntervalsSettings();

  // Check cache
  if (!forceRefresh) {
    const cached = storage.get(CACHE_KEY);
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
      return cached;
    }
  }

  // Try Intervals.icu first
  if (athleteId && apiKey) {
    try {
      const data = await fetchIntervalsMetrics(athleteId, apiKey);
      storage.set(CACHE_KEY, { ...data, fetchedAt: Date.now() });
      return data;
    } catch (e) {
      console.warn('Intervals.icu fetch failed, falling back to local calc:', e.message);
    }
  }

  // Local calculation fallback
  const local = computeLocalMetrics();
  if (local) {
    storage.set(CACHE_KEY, { ...local, fetchedAt: Date.now() });
    return local;
  }

  return null;
}

export { computeLocalMetrics, estimateTSS };
