// ============================================
// Analytics Page — Graphs & Progress
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
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    
    // Label
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '10px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('▼ Acum', x, top + 12);
    ctx.restore();
  }
};

export function renderAnalyticsPage() {
  const page = document.createElement('div');
  page.className = 'analytics-page';

  // Destroy old charts
  charts.forEach(c => c.destroy());
  charts = [];

  const weekNum = getCurrentWeek();
  const allVolumes = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];

  page.innerHTML = `
    <style>
      .evo-card { background: #0a0a0a; border-radius: 8px; padding: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.02); }
      .evo-header { border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; }
      .evo-title { font-size: 13px; font-weight: 500; color: #9ca3af; display: flex; align-items: center; gap: 8px; }
      .evo-title::before { content: ""; display: block; width: 4px; height: 14px; border-radius: 2px; }
      .evo-badge { font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(255,255,255,0.05); color: #9ca3af; }
    </style>
    <div class="page-body">
      <!-- EvoLab Sync Section -->
      <div class="evo-card animate-in" style="margin-bottom: var(--space-lg); border: 1px solid rgba(59, 130, 246, 0.3);">
        <div class="evo-header" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
          <div class="evo-title" style="before:background-color: #3b82f6;">🧠 EvoLab Insights (4 Săptămâni)</div>
          <button class="btn btn-sm btn-primary" id="btn-sync-evolab" style="font-size: 11px;">🔄 Sincronizează Date Reale din Coros</button>
        </div>
        <div id="evolab-results" style="margin-top: 16px; font-size: 12px; color: var(--text-secondary); display: none;">
          <!-- Results will be dumped here for now -->
        </div>
      </div>
      <!-- PMC (Performance Management Chart) -->
      <div class="evo-card animate-in" style="margin-bottom: var(--space-lg)">
        <div class="evo-header">
          <div class="evo-title" style="before:background-color: #3b82f6;">Base Fitness & Load Impact</div>
          <div class="evo-badge">Până în prezent</div>
        </div>
        <div style="height: 350px; position: relative;">
          <canvas id="pmc-chart"></canvas>
        </div>
      </div>

      <!-- Compliance % Chart -->
      <div class="evo-card animate-in animate-in-delay-1" style="margin-bottom: var(--space-lg)">
        <div class="evo-header">
          <div class="evo-title" style="before:background-color: #a855f7;">Consistență Săptămânală (Plan vs. Real)</div>
          <div class="evo-badge" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;">% Îndeplinire</div>
        </div>
        <div style="height: 250px; position: relative;">
          <canvas id="compliance-chart"></canvas>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: var(--space-lg)">
        <!-- Swim Progression -->
        <div class="evo-card animate-in animate-in-delay-2">
          <div class="evo-header">
            <div class="evo-title" style="before:background-color: #06b6d4;">Progresie Înot</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="swim-chart"></canvas>
          </div>
        </div>

        <!-- Run Progression -->
        <div class="evo-card animate-in animate-in-delay-2">
          <div class="evo-header">
            <div class="evo-title" style="before:background-color: #f97316;">Progresie Alergare</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="run-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Bike Progression -->
        <div class="evo-card animate-in animate-in-delay-3">
          <div class="evo-header">
            <div class="evo-title" style="before:background-color: #22c55e;">Progresie Bicicletă</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="bike-chart"></canvas>
          </div>
        </div>

        <!-- Training Hours: Plan vs Real -->
        <div class="evo-card animate-in animate-in-delay-3">
          <div class="evo-header">
            <div class="evo-title" style="before:background-color: #ec4899;">Ore de Antrenament / Săptămână</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="hours-chart"></canvas>
          </div>
        </div>
      </div>
    </div>
  `;

  // Attach Sync EvoLab event
  setTimeout(() => {
    const btnSync = page.querySelector('#btn-sync-evolab');
    const resultsDiv = page.querySelector('#evolab-results');
    if (btnSync) {
      btnSync.addEventListener('click', async () => {
        btnSync.disabled = true;
        btnSync.textContent = '⏳ Se încarcă...';
        resultsDiv.style.display = 'block';
        resultsDiv.innerHTML = 'Aștept răspunsul AI-ului Coros MCP...';
        try {
          const { fetchEvoLab } = await import('./coros.js');
          const data = await fetchEvoLab();
          resultsDiv.innerHTML = `<pre style="white-space: pre-wrap; font-family: monospace; font-size: 10px; color: #a855f7;">${JSON.stringify(data, null, 2)}</pre>`;
        } catch (e) {
          resultsDiv.innerHTML = `<div style="color: #ef4444;">Eroare: ${e.message}</div>`;
        } finally {
          btnSync.disabled = false;
          btnSync.textContent = '🔄 Sincronizează Date Reale din Coros';
        }
      });
    }
  }, 100);

  // Render charts after DOM is ready
  setTimeout(() => {
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      layout: { padding: { top: 20 } },
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
      interaction: {
        mode: 'index',
        intersect: false,
      },
      scales: {
        x: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: 'rgba(232,232,240,0.4)', font: { family: 'Inter', size: 10 } }
        },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)', drawBorder: false },
          ticks: { color: 'rgba(232,232,240,0.4)', font: { family: 'Inter', size: 10 } }
        }
      }
    };

    const weekLabels = allVolumes.map(v => {
      const deload = v.deload ? '🔄' : v.simulation ? '🏁' : '';
      return `S${v.week}${deload}`;
    });

    // ── PMC Algorithm (Fitness vs Fatigue) ─────────────────────────────────
    const today = new Date();
    const daysDiff = Math.max(14, Math.floor((today - PLAN_START) / (1000 * 60 * 60 * 24)) + 7); 
    
    const pmcLabels = [];
    const ctlData = [];
    const atlData = [];
    const tsbData = [];
    const tssData = [];
    
    let currentCTL = 0;
    let currentATL = 0;
    
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(PLAN_START);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      if (d.getDay() === 1) {
        pmcLabels.push(d.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }));
      } else {
        pmcLabels.push('');
      }
      
      const logs = storage.getWorkoutLog(dateStr) || [];
      let dailyTSS = 0;
      
      logs.forEach(log => {
          const dur = parseInt(log.duration) || 0;
          const hr = parseInt(log.hr) || 0;
          const rpe = parseInt(log.rpe) || (hr ? Math.max(1, (hr / 150) * 10) : 5);
          if (dur > 0) {
              dailyTSS += (dur / 60) * (rpe * 10);
          }
      });
      
      tssData.push(dailyTSS);
      currentCTL = currentCTL * Math.exp(-1/42) + dailyTSS * (1 - Math.exp(-1/42));
      currentATL = currentATL * Math.exp(-1/7) + dailyTSS * (1 - Math.exp(-1/7));
      
      ctlData.push(currentCTL);
      atlData.push(currentATL);
      tsbData.push(currentCTL - currentATL);
    }
    
    const pmcCtx = page.querySelector('#pmc-chart').getContext('2d');
    const gradCTL = pmcCtx.createLinearGradient(0, 0, 0, 350);
    gradCTL.addColorStop(0, 'rgba(59, 130, 246, 0.4)');
    gradCTL.addColorStop(1, 'rgba(59, 130, 246, 0)');

    if (pmcCtx) {
      charts.push(new Chart(pmcCtx, {
        type: 'line',
        data: {
          labels: pmcLabels,
          datasets: [
            {
              type: 'bar',
              label: 'Form (TSB)',
              data: tsbData,
              backgroundColor: tsbData.map(v => v >= 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(239, 68, 68, 0.2)'),
              yAxisID: 'y1',
              barPercentage: 1.0,
              categoryPercentage: 1.0,
            },
            {
              type: 'line',
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
              type: 'line',
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
              type: 'bubble',
              label: 'Daily Load',
              data: tssData.map((v, i) => ({ x: i, y: v, r: v > 0 ? 2 : 0 })),
              backgroundColor: 'rgba(255,255,255,0.3)',
              yAxisID: 'y',
            }
          ]
        },
        options: {
          ...chartDefaults,
          interaction: { mode: 'index', intersect: false },
          scales: {
            x: { ...chartDefaults.scales.x, grid: { display: false } },
            y: { 
              ...chartDefaults.scales.y, 
              position: 'left', 
              title: { display: true, text: 'TSS / CTL / ATL', color: 'rgba(232,232,240,0.4)', font: { size: 10 } }
            },
            y1: {
              position: 'right',
              grid: { display: false },
              ticks: { color: 'rgba(232,232,240,0.4)', font: { size: 10 } },
              title: { display: true, text: 'Form (TSB)', color: 'rgba(232,232,240,0.4)', font: { size: 10 } }
            }
          }
        }
      }));
    }

    // ── Calculate Actual Volumes per week ────────────────────────────────────
    const actualVolumes = allVolumes.map(v => {
      let runTotal = 0, bikeTotal = 0, swimTotal = 0, totalMinutes = 0;
      
      const start = new Date(PLAN_START);
      start.setDate(start.getDate() + (v.week - 1) * 7);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const logs = storage.getWorkoutLog(dateStr) || [];
        
        logs.forEach(log => {
          if (!log.isSkipped) {
            const dist = parseFloat(log.distance) || 0;
            const dur = parseInt(log.duration) || 0;
            totalMinutes += dur;
            if (log.type === 'run') runTotal += dist;
            if (log.type === 'bike') bikeTotal += dist;
            if (log.type === 'swim') swimTotal += dist * 1000; // km to m
          }
        });
      }
      return { runTotal, bikeTotal, swimTotal, totalHours: totalMinutes / 60 };
    });

    // Only show real data up to current week (don't show 0 for future weeks)
    const realSwimData = actualVolumes.map((v, i) => i < weekNum && v.swimTotal > 0 ? v.swimTotal : null);
    const realRunData = actualVolumes.map((v, i) => i < weekNum && v.runTotal > 0 ? v.runTotal : null);
    const realBikeData = actualVolumes.map((v, i) => i < weekNum && v.bikeTotal > 0 ? v.bikeTotal : null);
    const realHoursData = actualVolumes.map((v, i) => i < weekNum && v.totalHours > 0 ? Math.round(v.totalHours * 10) / 10 : null);

    // ── Compliance % Chart ──────────────────────────────────────────────────
    const complianceData = allVolumes.map((v, i) => {
      if (i >= weekNum) return null; // future weeks
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
              borderColor: 'rgba(255, 255, 255, 0.15)',
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
                if (v >= 90) return 'rgba(34, 197, 94, 0.7)';   // green
                if (v >= 70) return 'rgba(249, 115, 22, 0.7)';  // orange
                if (v >= 50) return 'rgba(234, 179, 8, 0.7)';   // yellow
                return 'rgba(239, 68, 68, 0.7)';                // red
              }),
              borderRadius: 6,
              barPercentage: 0.6,
            }
          ]
        },
        options: {
          ...chartDefaults,
          plugins: {
            ...chartDefaults.plugins,
            tooltip: {
              ...chartDefaults.plugins.tooltip,
              callbacks: {
                label: (ctx) => {
                  if (ctx.dataset.label === 'Target (80%)') return null;
                  return ctx.raw !== null ? `Îndeplinire: ${ctx.raw}%` : '';
                }
              }
            }
          },
          scales: {
            ...chartDefaults.scales,
            y: { 
              ...chartDefaults.scales.y, 
              min: 0, 
              max: 110,
              title: { display: true, text: '%', color: 'rgba(232,232,240,0.4)', font: { size: 10 } },
              ticks: {
                ...chartDefaults.scales.y.ticks,
                callback: v => v + '%'
              }
            }
          }
        },
        plugins: [currentWeekLinePlugin]
      }));
    }

    // ── Swim chart (cyan theme) ─────────────────────────────────────────────
    const swimCtx = page.querySelector('#swim-chart');
    if (swimCtx) {
      charts.push(new Chart(swimCtx, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [
            {
              label: 'Planificat (m)',
              data: allVolumes.map(v => v.swim),
              borderColor: 'rgba(6, 182, 212, 0.35)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (m)',
              data: realSwimData,
              borderColor: '#06b6d4',
              backgroundColor: 'rgba(6, 182, 212, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#06b6d4',
              borderWidth: 2,
              spanGaps: false,
            }
          ]
        },
        options: chartDefaults,
        plugins: [currentWeekLinePlugin]
      }));
    }

    // ── Run chart (orange theme) ────────────────────────────────────────────
    const runCtx = page.querySelector('#run-chart');
    if (runCtx) {
      charts.push(new Chart(runCtx, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [
            {
              label: 'Planificat (km)',
              data: allVolumes.map(v => v.runTotal),
              borderColor: 'rgba(249, 115, 22, 0.35)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (km)',
              data: realRunData,
              borderColor: '#f97316',
              backgroundColor: 'rgba(249, 115, 22, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#f97316',
              borderWidth: 2,
              spanGaps: false,
            }
          ]
        },
        options: chartDefaults,
        plugins: [currentWeekLinePlugin]
      }));
    }

    // ── Bike chart (green theme) ────────────────────────────────────────────
    const bikeCtx = page.querySelector('#bike-chart');
    if (bikeCtx) {
      charts.push(new Chart(bikeCtx, {
        type: 'line',
        data: {
          labels: weekLabels,
          datasets: [
            {
              label: 'Planificat (km)',
              data: allVolumes.map(v => v.bikeTotal),
              borderColor: 'rgba(34, 197, 94, 0.35)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (km)',
              data: realBikeData,
              borderColor: '#22c55e',
              backgroundColor: 'rgba(34, 197, 94, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              pointBackgroundColor: '#22c55e',
              borderWidth: 2,
              spanGaps: false,
            }
          ]
        },
        options: chartDefaults,
        plugins: [currentWeekLinePlugin]
      }));
    }

    // ── Training Hours: Plan vs Real ────────────────────────────────────────
    const plannedHours = allVolumes.map(v => {
      const swimH = (v.swim * 2 / 100) / 60;
      const runH = (v.runTotal * 6) / 60;
      const bikeH = (v.bikeTotal * 2.5) / 60;
      const gymH = (v.gym || 0) * 1;
      return Math.round((swimH + runH + bikeH + gymH) * 10) / 10;
    });

    const hoursCtx = page.querySelector('#hours-chart');
    if (hoursCtx) {
      charts.push(new Chart(hoursCtx, {
        type: 'bar',
        data: {
          labels: weekLabels,
          datasets: [
            {
              label: 'Planificat (ore)',
              data: plannedHours,
              backgroundColor: allVolumes.map(v => {
                const phase = PHASES.find(p => v.week >= p.weeks[0] && v.week <= p.weeks[1]);
                return phase ? phase.color + '33' : 'rgba(139,92,246,0.2)';
              }),
              borderColor: allVolumes.map(v => {
                const phase = PHASES.find(p => v.week >= p.weeks[0] && v.week <= p.weeks[1]);
                return phase ? phase.color + '66' : 'rgba(139,92,246,0.4)';
              }),
              borderWidth: 1,
              borderRadius: 4,
              barPercentage: 0.5,
              categoryPercentage: 0.8,
            },
            {
              label: 'Realizat (ore)',
              data: realHoursData,
              backgroundColor: 'rgba(255, 255, 255, 0.65)',
              borderRadius: 4,
              barPercentage: 0.5,
              categoryPercentage: 0.8,
            }
          ]
        },
        options: {
          ...chartDefaults,
          scales: {
            ...chartDefaults.scales,
            y: { ...chartDefaults.scales.y, title: { display: true, text: 'ore', color: 'rgba(232,232,240,0.4)', font: { family: 'Inter', size: 11 } } }
          }
        },
        plugins: [currentWeekLinePlugin]
      }));
    }
  }, 100);

  return page;
}
