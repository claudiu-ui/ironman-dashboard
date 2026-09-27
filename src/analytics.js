// ============================================
// Analytics Page — Coros EvoLab Style
// ============================================

import Chart from 'chart.js/auto';
import { PHASE1_VOLUMES, PHASE2_VOLUMES, PHASE3_VOLUMES, PHASE4_VOLUMES, getCurrentWeek, PHASES, PLAN_START } from './data.js';
import { storage } from './storage.js';

let charts = [];

// EvoLab Chart Defaults
const evoDefaults = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      align: 'end',
      labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 }, usePointStyle: true, boxWidth: 6 }
    },
    tooltip: {
      backgroundColor: '#161821',
      titleColor: '#fff',
      bodyColor: '#9ca3af',
      borderColor: 'rgba(255,255,255,0.1)',
      borderWidth: 1,
      padding: 12,
      cornerRadius: 8,
      titleFont: { family: 'Inter', weight: '600' },
      bodyFont: { family: 'Inter' },
    }
  },
  interaction: { mode: 'index', intersect: false },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6b7280', font: { family: 'Inter', size: 10 } }
    },
    y: {
      grid: { color: 'rgba(255,255,255,0.05)', drawBorder: false },
      ticks: { color: '#6b7280', font: { family: 'Inter', size: 10 } }
    }
  }
};

export function renderAnalyticsPage() {
  const page = document.createElement('div');
  page.className = 'analytics-page';

  charts.forEach(c => c.destroy());
  charts = [];

  const weekNum = getCurrentWeek();
  const allVolumes = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];

  // 1. CALCULATE RECENT 4 WEEKS SUMMARY & INTENSITY
  const today = new Date();
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);

  let sumTSS = 0;
  let sumTime = 0; // minutes
  let sumRunDist = 0, sumBikeDist = 0, sumSwimDist = 0;
  let rpeDistribution = { aerobic: 0, power: 0, threshold: 0, anaerobic: 0 }; // in minutes

  const logs4W = [];
  for (let i = 0; i < 28; i++) {
    const d = new Date(fourWeeksAgo);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLogs = storage.getWorkoutLog(dateStr) || [];
    dayLogs.forEach(l => {
      if (!l.isSkipped && parseInt(l.duration) > 0) {
        logs4W.push(l);
        const dur = parseInt(l.duration);
        sumTime += dur;
        
        const hr = parseInt(l.hr) || 0;
        const rpe = parseInt(l.rpe) || (hr ? Math.max(1, (hr / 150) * 10) : 5);
        sumTSS += (dur / 60) * (rpe * 10);
        
        const dist = parseFloat(l.distance) || 0;
        if (l.type === 'run') sumRunDist += dist;
        if (l.type === 'bike') sumBikeDist += dist;
        if (l.type === 'swim') sumSwimDist += dist * 1000;
        
        if (rpe <= 4) rpeDistribution.aerobic += dur;
        else if (rpe <= 6) rpeDistribution.power += dur;
        else if (rpe <= 8) rpeDistribution.threshold += dur;
        else rpeDistribution.anaerobic += dur;
      }
    });
  }

  const formatHours = (mins) => `${Math.floor(mins/60)}h ${mins%60}m`;
  const formatNum = (num) => Math.round(num).toLocaleString();

  page.innerHTML = `
    <style>
      .evo-grid { display: grid; grid-template-columns: 1fr; gap: 16px; margin-bottom: 24px; font-family: -apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      @media (min-width: 768px) { .evo-grid { grid-template-columns: repeat(2, 1fr); } }
      @media (min-width: 1024px) { .evo-grid { grid-template-columns: repeat(4, 1fr); } }
      .evo-card { background: #161821; border-radius: 8px; padding: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.02); }
      .evo-card-title { font-size: 13px; font-weight: 500; color: #9ca3af; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
      .evo-card-title::before { content: ""; display: block; width: 4px; height: 14px; background: #3b82f6; border-radius: 2px; }
      .evo-summary-val { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 4px; }
      .evo-summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    </style>

    <div class="page-body">
      
      <!-- Top 4-Week Summary -->
      <div style="margin-bottom: 12px; font-size: 12px; color: #9ca3af; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em;">
        4-Week Summary
      </div>
      <div class="evo-grid">
        <div class="evo-card" style="padding: 16px;">
          <div class="evo-summary-val">${formatNum(sumTSS)}</div>
          <div class="evo-summary-label">Training Load (TSS)</div>
        </div>
        <div class="evo-card" style="padding: 16px;">
          <div class="evo-summary-val">${formatHours(sumTime)}</div>
          <div class="evo-summary-label">Training Time</div>
        </div>
        <div class="evo-card" style="padding: 16px;">
          <div class="evo-summary-val">${formatNum(sumRunDist)} <span style="font-size:12px;color:#6b7280;">km</span></div>
          <div class="evo-summary-label">Run Distance</div>
        </div>
        <div class="evo-card" style="padding: 16px;">
          <div class="evo-summary-val">${formatNum(sumBikeDist)} <span style="font-size:12px;color:#6b7280;">km</span></div>
          <div class="evo-summary-label">Bike Distance</div>
        </div>
      </div>

      <!-- Main PMC Chart (Base Fitness) -->
      <div class="evo-card animate-in" style="margin-bottom: 24px;">
        <div class="evo-card-title">Base Fitness & Load Impact</div>
        <div style="height: 350px; position: relative; padding-top: 10px;">
          <canvas id="evo-pmc-chart"></canvas>
        </div>
      </div>

      <!-- Donuts -->
      <div class="evo-grid" style="grid-template-columns: 1fr; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }">
        
        <div class="evo-card animate-in animate-in-delay-1">
          <div class="evo-card-title" style="--tw-bg-opacity: 1; before:background-color: #f97316;">4-Week Intensity Distribution</div>
          <div style="height: 250px; position: relative; display: flex; align-items: center; justify-content: center;">
            <canvas id="intensity-donut"></canvas>
          </div>
          <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: #9ca3af;">
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#ef4444;"></span>Anaerobic (RPE 9-10)</span> <span>${formatHours(rpeDistribution.anaerobic)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#f97316;"></span>Threshold (RPE 7-8)</span> <span>${formatHours(rpeDistribution.threshold)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#2ed573;"></span>Aerobic Power (RPE 5-6)</span> <span>${formatHours(rpeDistribution.power)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>Aerobic Endurance (RPE 1-4)</span> <span>${formatHours(rpeDistribution.aerobic)}</span></div>
          </div>
        </div>

        <div class="evo-card animate-in animate-in-delay-2">
          <div class="evo-card-title">Discipline Breakdown (Time)</div>
          <div style="height: 250px; position: relative; display: flex; align-items: center; justify-content: center;">
            <canvas id="discipline-donut"></canvas>
          </div>
        </div>

      </div>

      <!-- Compliance -->
      <div class="evo-card animate-in animate-in-delay-3">
        <div class="evo-card-title">Weekly Compliance (%)</div>
        <div style="height: 250px; position: relative;">
          <canvas id="compliance-chart"></canvas>
        </div>
      </div>

    </div>
  `;

  setTimeout(() => {
    // ── PMC Algorithm ─────────────────────────────────
    const pmcDays = Math.max(28, Math.floor((today - PLAN_START) / (1000 * 60 * 60 * 24)) + 7); 
    const pmcLabels = [];
    const ctlData = [], atlData = [], tssData = [];
    let currentCTL = 0, currentATL = 0;
    
    for (let i = 0; i < pmcDays; i++) {
      const d = new Date(PLAN_START);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      pmcLabels.push(d.getDay() === 1 ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '');
      
      const logs = storage.getWorkoutLog(dateStr) || [];
      let dailyTSS = 0;
      logs.forEach(log => {
          const dur = parseInt(log.duration) || 0;
          const hr = parseInt(log.hr) || 0;
          const rpe = parseInt(log.rpe) || (hr ? Math.max(1, (hr / 150) * 10) : 5);
          if (dur > 0) dailyTSS += (dur / 60) * (rpe * 10);
      });
      
      tssData.push(dailyTSS);
      currentCTL = currentCTL * Math.exp(-1/42) + dailyTSS * (1 - Math.exp(-1/42));
      currentATL = currentATL * Math.exp(-1/7) + dailyTSS * (1 - Math.exp(-1/7));
      
      ctlData.push(currentCTL);
      atlData.push(currentATL);
    }
    
    const pmcCtx = page.querySelector('#evo-pmc-chart').getContext('2d');
    const gradCTL = pmcCtx.createLinearGradient(0, 0, 0, 350);
    gradCTL.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradCTL.addColorStop(1, 'rgba(59, 130, 246, 0)');

    charts.push(new Chart(pmcCtx, {
      type: 'line',
      data: {
        labels: pmcLabels,
        datasets: [
          {
            label: 'Base Fitness (CTL)',
            data: ctlData,
            borderColor: '#3b82f6',
            backgroundColor: gradCTL,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Load Impact (ATL)',
            data: atlData,
            borderColor: '#ef4444',
            borderDash: [5, 5],
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 1.5,
            yAxisID: 'y',
          },
          {
            type: 'bar',
            label: 'Daily Load',
            data: tssData,
            backgroundColor: 'rgba(255,255,255,0.1)',
            yAxisID: 'y',
            barPercentage: 0.8,
            categoryPercentage: 1.0,
          }
        ]
      },
      options: {
        ...evoDefaults,
        scales: {
          x: { ...evoDefaults.scales.x },
          y: { 
            ...evoDefaults.scales.y, 
            position: 'left', 
            title: { display: false }
          }
        }
      }
    }));

    // ── Intensity Donut ─────────────────────────────────
    const donutOpts = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: evoDefaults.plugins.tooltip
      }
    };

    const intensityCtx = page.querySelector('#intensity-donut');
    charts.push(new Chart(intensityCtx, {
      type: 'doughnut',
      data: {
        labels: ['Anaerobic', 'Threshold', 'Aerobic Power', 'Aerobic Endur.'],
        datasets: [{
          data: [rpeDistribution.anaerobic, rpeDistribution.threshold, rpeDistribution.power, rpeDistribution.aerobic],
          backgroundColor: ['#ef4444', '#f97316', '#2ed573', '#3b82f6'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: donutOpts
    }));

    // ── Discipline Donut ─────────────────────────────────
    let tSwim = 0, tBike = 0, tRun = 0, tGym = 0;
    logs4W.forEach(l => {
      const dur = parseInt(l.duration);
      if(l.type === 'swim') tSwim += dur;
      else if(l.type === 'bike') tBike += dur;
      else if(l.type === 'run') tRun += dur;
      else tGym += dur;
    });

    const discCtx = page.querySelector('#discipline-donut');
    charts.push(new Chart(discCtx, {
      type: 'doughnut',
      data: {
        labels: ['Swim', 'Bike', 'Run', 'Gym'],
        datasets: [{
          data: [tSwim, tBike, tRun, tGym],
          backgroundColor: ['#06b6d4', '#22c55e', '#f97316', '#a855f7'],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        ...donutOpts,
        plugins: {
          legend: { position: 'right', labels: { color: '#9ca3af', font: {size: 11}, usePointStyle: true } },
          tooltip: evoDefaults.plugins.tooltip
        }
      }
    }));

    // ── Compliance % ─────────────────────────────────
    const weekLabels = allVolumes.map(v => `W${v.week}`);
    const actualVolumes = allVolumes.map(v => {
      let runTotal = 0, bikeTotal = 0, swimTotal = 0;
      const start = new Date(PLAN_START);
      start.setDate(start.getDate() + (v.week - 1) * 7);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const logs = storage.getWorkoutLog(d.toISOString().split('T')[0]) || [];
        logs.forEach(log => {
          if (!log.isSkipped) {
            const dist = parseFloat(log.distance) || 0;
            if (log.type === 'run') runTotal += dist;
            if (log.type === 'bike') bikeTotal += dist;
            if (log.type === 'swim') swimTotal += dist * 1000;
          }
        });
      }
      return { runTotal, bikeTotal, swimTotal };
    });

    const complianceData = allVolumes.map((v, i) => {
      if (i >= weekNum) return null;
      const av = actualVolumes[i];
      const swimPct = v.swim > 0 ? Math.min(100, (av.swimTotal / v.swim) * 100) : 100;
      const runPct = v.runTotal > 0 ? Math.min(100, (av.runTotal / v.runTotal) * 100) : 100;
      const bikePct = v.bikeTotal > 0 ? Math.min(100, (av.bikeTotal / v.bikeTotal) * 100) : 100;
      return Math.round((swimPct + runPct + bikePct) / 3);
    });

    const complianceCtx = page.querySelector('#compliance-chart');
    charts.push(new Chart(complianceCtx, {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [
          {
            label: 'Compliance %',
            data: complianceData,
            backgroundColor: complianceData.map(v => {
              if (v === null) return 'transparent';
              if (v >= 90) return '#2ed573';
              if (v >= 70) return '#f97316';
              return '#ef4444';
            }),
            borderRadius: 4,
            barPercentage: 0.6,
          }
        ]
      },
      options: {
        ...evoDefaults,
        scales: {
          ...evoDefaults.scales,
          y: { ...evoDefaults.scales.y, min: 0, max: 110 }
        }
      }
    }));

  }, 100);

  return page;
}
