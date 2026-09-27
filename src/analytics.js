// ============================================
// Analytics Page — Coros EvoLab Style + Ironman Tracking
// ============================================

import Chart from 'chart.js/auto';
import { PHASE1_VOLUMES, PHASE2_VOLUMES, PHASE3_VOLUMES, PHASE4_VOLUMES, getCurrentWeek, PHASES, PLAN_START } from './data.js';
import { storage } from './storage.js';

let charts = [];

// Vertical line plugin — draws "current week" marker
const currentWeekLinePlugin = {
  id: 'currentWeekLine',
  afterDraw(chart) {
    const weekNum = getCurrentWeek();
    const meta = chart.getDatasetMeta(0);
    if (!meta || !meta.data || weekNum - 1 >= meta.data.length) return;
    
    const x = meta.data[weekNum - 1]?.x;
    if (!x) return;
    
    const { ctx, chartArea: { top, bottom } } = chart;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('▼ Acum', x, top - 4);
    ctx.restore();
  }
};

export function renderAnalyticsPage() {
  const page = document.createElement('div');
  page.className = 'analytics-page';

  charts.forEach(c => c.destroy());
  charts = [];

  const weekNum = getCurrentWeek();
  const allVolumes = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];

  // ── 1. Calculate 4-Week Summary & Intensity ────────────────
  const today = new Date();
  const fourWeeksAgo = new Date(today);
  fourWeeksAgo.setDate(today.getDate() - 28);

  let sumTSS = 0;
  let sumTime = 0; // minutes
  let sumRunDist = 0, sumBikeDist = 0, sumSwimDist = 0;
  let rpeDistribution = { aerobic: 0, power: 0, threshold: 0, anaerobic: 0 };
  let logs4W = [];

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
      .evo-card-title { font-size: 13px; font-weight: 500; color: #9ca3af; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; justify-content: space-between; }
      .evo-card-title-left { display: flex; align-items: center; gap: 8px; }
      .evo-card-title-left::before { content: ""; display: block; width: 4px; height: 14px; background: #3b82f6; border-radius: 2px; }
      .evo-badge { background: rgba(59, 130, 246, 0.15); color: #60a5fa; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
      .evo-summary-val { font-size: 24px; font-weight: 600; color: #fff; margin-bottom: 4px; }
      .evo-summary-label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; }
    </style>

    <div class="page-body">
      
      <!-- Top 4-Week Summary -->
      <div style="margin-bottom: 12px; font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
        4-Week Summary (Coros EvoLab)
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
          <div class="evo-summary-val">${formatNum(sumRunDist)} <span style="font-size:12px;color:#6b7280;font-weight:400;">km</span></div>
          <div class="evo-summary-label">Run Distance</div>
        </div>
        <div class="evo-card" style="padding: 16px;">
          <div class="evo-summary-val">${formatNum(sumBikeDist)} <span style="font-size:12px;color:#6b7280;font-weight:400;">km</span></div>
          <div class="evo-summary-label">Bike Distance</div>
        </div>
      </div>

      <!-- Main PMC Chart (Base Fitness) -->
      <div class="evo-card animate-in" style="margin-bottom: 24px;">
        <div class="evo-card-title">
          <div class="evo-card-title-left">Base Fitness & Load Impact</div>
          <div class="evo-badge">Până în prezent</div>
        </div>
        <div style="height: 350px; position: relative; padding-top: 10px;">
          <canvas id="evo-pmc-chart"></canvas>
        </div>
      </div>

      <!-- Donuts -->
      <div class="evo-grid" style="grid-template-columns: 1fr; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }">
        <div class="evo-card animate-in animate-in-delay-1">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#f97316;">4-Week Intensity Distribution</div>
            <div class="evo-badge" style="background:rgba(249,115,22,0.15);color:#fb923c;">RPE Based</div>
          </div>
          <div style="height: 200px; position: relative; display: flex; align-items: center; justify-content: center;">
            <canvas id="intensity-donut"></canvas>
          </div>
          <div style="margin-top: 16px; display: flex; flex-direction: column; gap: 8px; font-size: 11px; color: #9ca3af;">
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#ef4444;"></span>Anaerobic (RPE 9-10)</span> <span>${formatHours(rpeDistribution.anaerobic)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#f97316;"></span>Threshold (RPE 7-8)</span> <span>${formatHours(rpeDistribution.threshold)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#2ed573;"></span>Aerobic Power (RPE 5-6)</span> <span>${formatHours(rpeDistribution.power)}</span></div>
             <div style="display:flex; justify-content:space-between;"><span style="display:flex; align-items:center; gap:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#3b82f6;"></span>Aerobic Endurance (RPE 1-4)</span> <span>${formatHours(rpeDistribution.aerobic)}</span></div>
          </div>
        </div>

        <div class="evo-card animate-in animate-in-delay-1">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#a855f7;">Discipline Breakdown</div>
            <div class="evo-badge" style="background:rgba(168,85,247,0.15);color:#c084fc;">Time</div>
          </div>
          <div style="height: 200px; position: relative; display: flex; align-items: center; justify-content: center;">
            <canvas id="discipline-donut"></canvas>
          </div>
          <div style="margin-top: 16px; font-size: 11px; color: #9ca3af; text-align: center;">
            Împărțirea orelor pe discipline din ultimele 28 de zile.
          </div>
        </div>
      </div>

      <!-- Ironman Plan Tracking Section -->
      <div style="margin-bottom: 12px; margin-top: 24px; font-size: 11px; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em;">
        Ironman Progress (Plan vs. Real)
      </div>

      <!-- Compliance % Chart -->
      <div class="evo-card animate-in animate-in-delay-2" style="margin-bottom: var(--space-lg)">
        <div class="evo-card-title">
          <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#22c55e;">📊 Consistență Săptămânală (Plan vs. Real)</div>
          <div class="evo-badge" style="background:rgba(34,197,94,0.15);color:#4ade80;">% Îndeplinire</div>
        </div>
        <div style="height: 250px; position: relative;">
          <canvas id="compliance-chart"></canvas>
        </div>
      </div>

      <div class="evo-grid" style="grid-template-columns: 1fr; @media(min-width: 768px){ grid-template-columns: 1fr 1fr; }">
        
        <!-- Swim Progression -->
        <div class="evo-card animate-in animate-in-delay-3">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#06b6d4;">🏊 Progresie Înot</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="swim-chart"></canvas>
          </div>
        </div>

        <!-- Run Progression -->
        <div class="evo-card animate-in animate-in-delay-3">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#f97316;">🏃 Progresie Alergare</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="run-chart"></canvas>
          </div>
        </div>

        <!-- Bike Progression -->
        <div class="evo-card animate-in animate-in-delay-4">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#eab308;">🚴 Progresie Bicicletă</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="bike-chart"></canvas>
          </div>
        </div>

        <!-- Training Hours -->
        <div class="evo-card animate-in animate-in-delay-4">
          <div class="evo-card-title">
            <div class="evo-card-title-left" style="--tw-bg-opacity:1; before:background-color:#ec4899;">⏱️ Ore de Antrenament / Săpt.</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="hours-chart"></canvas>
          </div>
        </div>

      </div>

    </div>
  `;

  // Render charts after DOM is ready
  setTimeout(() => {
    
    // Coros EvoLab Dark Theme Defaults
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { color: '#9ca3af', font: { family: 'Inter', size: 10 }, padding: 12, usePointStyle: true, boxWidth: 6 }
        },
        tooltip: {
          backgroundColor: '#161821',
          titleColor: '#fff',
          bodyColor: '#9ca3af',
          borderColor: 'rgba(255,255,255,0.05)',
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          titleFont: { family: 'Inter', weight: '600' },
          bodyFont: { family: 'Inter' },
        }
      },
      interaction: { mode: 'index', intersect: false },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: '#6b7280', font: { family: 'Inter', size: 9 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.02)', drawBorder: false },
          ticks: { color: '#6b7280', font: { family: 'Inter', size: 9 } }
        }
      }
    };

    const weekLabels = allVolumes.map(v => {
      const deload = v.deload ? '🔄' : v.simulation ? '🏁' : '';
      return `S${v.week}${deload}`;
    });

    // ── PMC Algorithm (Fitness vs Fatigue) ─────────────────────────────────
    const pmcDays = Math.max(28, Math.floor((today - PLAN_START) / (1000 * 60 * 60 * 24)) + 7); 
    const pmcLabels = [];
    const ctlData = [], atlData = [], tssData = [];
    let currentCTL = 0, currentATL = 0;
    
    for (let i = 0; i < pmcDays; i++) {
      const d = new Date(PLAN_START);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      pmcLabels.push(d.getDay() === 1 ? d.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }) : '');
      
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
            backgroundColor: 'rgba(255,255,255,0.05)',
            yAxisID: 'y',
            barPercentage: 0.8,
            categoryPercentage: 1.0,
          }
        ]
      },
      options: {
        ...chartDefaults,
        scales: {
          x: { ...chartDefaults.scales.x },
          y: { ...chartDefaults.scales.y, position: 'left' }
        }
      }
    }));

    // ── Intensity & Discipline Donuts ─────────────────────────────────
    const donutOpts = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: { display: false },
        tooltip: chartDefaults.plugins.tooltip
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
          borderWidth: 0, hoverOffset: 4
        }]
      },
      options: donutOpts
    }));

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
          backgroundColor: ['#06b6d4', '#eab308', '#f97316', '#a855f7'],
          borderWidth: 0, hoverOffset: 4
        }]
      },
      options: {
        ...donutOpts,
        plugins: {
          legend: { position: 'right', labels: { color: '#9ca3af', font: {size: 10}, usePointStyle: true } },
          tooltip: chartDefaults.plugins.tooltip
        }
      }
    }));

    // ── Plan vs Real Volumes ────────────────────────────────────
    const actualVolumes = allVolumes.map(v => {
      let runTotal = 0, bikeTotal = 0, swimTotal = 0, totalMinutes = 0;
      const start = new Date(PLAN_START);
      start.setDate(start.getDate() + (v.week - 1) * 7);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const logs = storage.getWorkoutLog(d.toISOString().split('T')[0]) || [];
        logs.forEach(log => {
          if (!log.isSkipped) {
            const dist = parseFloat(log.distance) || 0;
            const dur = parseInt(log.duration) || 0;
            totalMinutes += dur;
            if (log.type === 'run') runTotal += dist;
            if (log.type === 'bike') bikeTotal += dist;
            if (log.type === 'swim') swimTotal += dist * 1000;
          }
        });
      }
      return { runTotal, bikeTotal, swimTotal, totalHours: totalMinutes / 60 };
    });

    const realSwimData = actualVolumes.map((v, i) => i < weekNum && v.swimTotal > 0 ? v.swimTotal : null);
    const realRunData = actualVolumes.map((v, i) => i < weekNum && v.runTotal > 0 ? v.runTotal : null);
    const realBikeData = actualVolumes.map((v, i) => i < weekNum && v.bikeTotal > 0 ? v.bikeTotal : null);
    const realHoursData = actualVolumes.map((v, i) => i < weekNum && v.totalHours > 0 ? Math.round(v.totalHours * 10) / 10 : null);

    // ── Compliance % Chart ──────────────────────────────────────────────────
    const complianceData = allVolumes.map((v, i) => {
      if (i >= weekNum) return null;
      const av = actualVolumes[i];
      const swimPct = v.swim > 0 ? Math.min(100, (av.swimTotal / v.swim) * 100) : 100;
      const runPct = v.runTotal > 0 ? Math.min(100, (av.runTotal / v.runTotal) * 100) : 100;
      const bikePct = v.bikeTotal > 0 ? Math.min(100, (av.bikeTotal / v.bikeTotal) * 100) : 100;
      return Math.round((swimPct + runPct + bikePct) / 3);
    });

    const complianceCtx = page.querySelector('#compliance-chart');
    if (complianceCtx) {
      charts.push(new Chart(complianceCtx, {
        type: 'bar',
        data: {
          labels: weekLabels,
          datasets: [
            {
              type: 'line',
              label: 'Target (80%)',
              data: allVolumes.map(() => 80),
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderDash: [4, 4],
              pointRadius: 0,
              borderWidth: 1,
              fill: false,
            },
            {
              label: 'Consistență %',
              data: complianceData,
              backgroundColor: complianceData.map(v => {
                if (v === null) return 'transparent';
                if (v >= 90) return 'rgba(34, 197, 94, 0.7)';
                if (v >= 70) return 'rgba(249, 115, 22, 0.7)';
                if (v >= 50) return 'rgba(234, 179, 8, 0.7)';
                return 'rgba(239, 68, 68, 0.7)';
              }),
              borderRadius: 4,
              barPercentage: 0.5,
            }
          ]
        },
        options: {
          ...chartDefaults,
          scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, min: 0, max: 110 } }
        },
        plugins: [currentWeekLinePlugin]
      }));
    }

    // ── Discipline Progression Charts ─────────────────────────────────────────────
    const progOptions = {
      ...chartDefaults,
      plugins: { ...chartDefaults.plugins, legend: { display: false } },
    };

    const swimCtx = page.querySelector('#swim-chart');
    charts.push(new Chart(swimCtx, {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [
          { label: 'Planificat (m)', data: allVolumes.map(v => v.swim), borderColor: 'rgba(6, 182, 212, 0.3)', borderDash: [4, 4], fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
          { label: 'Realizat (m)', data: realSwimData, borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.1)', fill: true, tension: 0.3, pointRadius: 2, pointBackgroundColor: '#06b6d4', borderWidth: 2 }
        ]
      },
      options: progOptions, plugins: [currentWeekLinePlugin]
    }));

    const runCtx = page.querySelector('#run-chart');
    charts.push(new Chart(runCtx, {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [
          { label: 'Planificat (km)', data: allVolumes.map(v => v.runTotal), borderColor: 'rgba(249, 115, 22, 0.3)', borderDash: [4, 4], fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
          { label: 'Realizat (km)', data: realRunData, borderColor: '#f97316', backgroundColor: 'rgba(249, 115, 22, 0.1)', fill: true, tension: 0.3, pointRadius: 2, pointBackgroundColor: '#f97316', borderWidth: 2 }
        ]
      },
      options: progOptions, plugins: [currentWeekLinePlugin]
    }));

    const bikeCtx = page.querySelector('#bike-chart');
    charts.push(new Chart(bikeCtx, {
      type: 'line',
      data: {
        labels: weekLabels,
        datasets: [
          { label: 'Planificat (km)', data: allVolumes.map(v => v.bikeTotal), borderColor: 'rgba(234, 179, 8, 0.3)', borderDash: [4, 4], fill: false, tension: 0.3, pointRadius: 0, borderWidth: 1.5 },
          { label: 'Realizat (km)', data: realBikeData, borderColor: '#eab308', backgroundColor: 'rgba(234, 179, 8, 0.1)', fill: true, tension: 0.3, pointRadius: 2, pointBackgroundColor: '#eab308', borderWidth: 2 }
        ]
      },
      options: progOptions, plugins: [currentWeekLinePlugin]
    }));

    const plannedHours = allVolumes.map(v => {
      const swimH = (v.swim * 2 / 100) / 60;
      const runH = (v.runTotal * 6) / 60;
      const bikeH = (v.bikeTotal * 2.5) / 60;
      const gymH = (v.gym || 0) * 1;
      return Math.round((swimH + runH + bikeH + gymH) * 10) / 10;
    });

    const hoursCtx = page.querySelector('#hours-chart');
    charts.push(new Chart(hoursCtx, {
      type: 'bar',
      data: {
        labels: weekLabels,
        datasets: [
          { label: 'Planificat (ore)', data: plannedHours, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderRadius: 2, barPercentage: 0.5 },
          { label: 'Realizat (ore)', data: realHoursData, backgroundColor: 'rgba(255, 255, 255, 0.5)', borderRadius: 2, barPercentage: 0.5 }
        ]
      },
      options: { ...progOptions, scales: { ...progOptions.scales, y: { ...progOptions.scales.y, title: { display: true, text: 'ore', color: '#6b7280', font: {size:10} } } } },
      plugins: [currentWeekLinePlugin]
    }));

  }, 100);

  return page;
}
