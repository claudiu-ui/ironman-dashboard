// ============================================
// Analytics Page — Graphs & Progress
// ============================================

import Chart from 'chart.js/auto';
import { PHASE1_VOLUMES, PHASE2_VOLUMES, PHASE3_VOLUMES, PHASE4_VOLUMES, getCurrentWeek, PHASES, PLAN_START } from './data.js';
import { storage } from './storage.js';

let charts = [];

export function renderAnalyticsPage() {
  const page = document.createElement('div');
  page.className = 'analytics-page';

  // Destroy old charts
  charts.forEach(c => c.destroy());
  charts = [];

  const weekNum = getCurrentWeek();
  const allVolumes = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];

  page.innerHTML = `
    <div class="page-body">
      <!-- PMC (Performance Management Chart) -->
      <div class="card animate-in" style="margin-bottom: var(--space-lg)">
        <div class="card-header">
          <div class="card-title">📈 Fitness vs. Fatigue (PMC)</div>
          <div class="card-badge">Până în prezent</div>
        </div>
        <div style="height: 400px; position: relative;">
          <canvas id="pmc-chart"></canvas>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom: var(--space-lg)">
        <!-- Swim Progression -->
        <div class="card animate-in animate-in-delay-1">
          <div class="card-header">
            <div class="card-title">🏊 Progresie Înot</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="swim-chart"></canvas>
          </div>
        </div>

        <!-- Run Progression -->
        <div class="card animate-in animate-in-delay-2">
          <div class="card-header">
            <div class="card-title">🏃 Progresie Alergare</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="run-chart"></canvas>
          </div>
        </div>
      </div>

      <div class="grid-2">
        <!-- Bike Progression -->
        <div class="card animate-in animate-in-delay-3">
          <div class="card-header">
            <div class="card-title">🚴 Progresie Bicicletă</div>
          </div>
          <div style="height: 250px; position: relative;">
            <canvas id="bike-chart"></canvas>
          </div>
        </div>

        <!-- Weekly Summary -->
        <div class="card animate-in animate-in-delay-4">
          <div class="card-header">
            <div class="card-title">📊 Ore de Antrenament Estimate / Săptămână</div>
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
    const chartDefaults = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#e8e8f0', font: { family: 'Inter', size: 11 }, padding: 16, boxWidth: 12, boxHeight: 12, boxPadding: 6 }
        },
        tooltip: {
          backgroundColor: 'rgba(14,14,24,0.95)',
          titleColor: '#e8e8f0',
          bodyColor: 'rgba(232,232,240,0.7)',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 12,
          cornerRadius: 8,
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

    const allVolumes = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];
    const weekNum = getCurrentWeek();

    const weekLabels = allVolumes.map(v => {
      const deload = v.deload ? '🔄' : v.simulation ? '🏁' : '';
      return `S${v.week}${deload}`;
    });

    // PMC Algorithm (Fitness vs Fatigue)
    const today = new Date();
    // Plot from start to 7 days in the future
    const daysDiff = Math.max(14, Math.floor((today - PLAN_START) / (1000 * 60 * 60 * 24)) + 7); 
    
    const pmcLabels = [];
    const ctlData = []; // Fitness
    const atlData = []; // Fatigue
    const tsbData = []; // Form
    const tssData = []; // Daily Stress
    
    let currentCTL = 0;
    let currentATL = 0;
    
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(PLAN_START);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      
      // Reduce labels to one per week for readability, but keep daily data
      if (d.getDay() === 1) { // Monday
        pmcLabels.push(d.toLocaleDateString('ro-RO', { month: 'short', day: 'numeric' }));
      } else {
        pmcLabels.push('');
      }
      
      const logs = storage.getWorkoutLog(dateStr) || [];
      let dailyTSS = 0;
      
      logs.forEach(log => {
          const dur = parseInt(log.duration) || 0;
          const hr = parseInt(log.hr) || 0;
          const rpe = parseInt(log.rpe) || (hr ? Math.max(1, (hr / 150) * 10) : 5); // Fallback to RPE 5 if no HR/RPE
          
          if (dur > 0) {
              // Estimate TSS: 100 TSS = 1 hour at RPE 10 (Threshold).
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
    
    const pmcCtx = page.querySelector('#pmc-chart');
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
              backgroundColor: tsbData.map(v => v >= 0 ? 'rgba(255, 255, 255, 0.15)' : 'rgba(220, 38, 38, 0.3)'),
              yAxisID: 'y1',
              barPercentage: 1.0,
              categoryPercentage: 1.0,
            },
            {
              type: 'line',
              label: 'Fitness (CTL)',
              data: ctlData,
              borderColor: '#e5e5e5',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              fill: true,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 2,
              yAxisID: 'y',
            },
            {
              type: 'line',
              label: 'Fatigue (ATL)',
              data: atlData,
              borderColor: '#dc2626',
              borderDash: [5, 5],
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
              yAxisID: 'y',
            },
            {
              type: 'bubble',
              label: 'TSS Zilnic',
              data: tssData.map((v, i) => ({ x: i, y: v, r: v > 0 ? 3 : 0 })),
              backgroundColor: 'rgba(232,232,240,0.5)',
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

    // Calculate Actual Volumes per week
    const actualVolumes = allVolumes.map(v => {
      let runTotal = 0;
      let bikeTotal = 0;
      let swimTotal = 0;
      
      const start = new Date(PLAN_START);
      start.setDate(start.getDate() + (v.week - 1) * 7);
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const logs = storage.getWorkoutLog(dateStr) || [];
        
        logs.forEach(log => {
          if (log.distance > 0) {
            if (log.type === 'run') runTotal += parseFloat(log.distance);
            if (log.type === 'bike') bikeTotal += parseFloat(log.distance);
            if (log.type === 'swim') swimTotal += parseFloat(log.distance) * 1000;
          }
        });
      }
      return { runTotal, bikeTotal, swimTotal };
    });

    // Swim chart
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
              borderColor: 'rgba(239, 68, 68, 0.4)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (m)',
              data: actualVolumes.map(v => v.swimTotal > 0 ? v.swimTotal : null),
              borderColor: '#ef4444',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              borderWidth: 2,
              spanGaps: true
            }
          ]
        },
        options: chartDefaults
      }));
    }

    // Run chart
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
              borderColor: 'rgba(185, 28, 28, 0.4)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (km)',
              data: actualVolumes.map(v => v.runTotal > 0 ? v.runTotal : null),
              borderColor: '#b91c1c',
              backgroundColor: 'rgba(185, 28, 28, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              borderWidth: 2,
              spanGaps: true
            }
          ]
        },
        options: chartDefaults
      }));
    }

    // Bike chart
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
              borderColor: 'rgba(220, 38, 38, 0.4)',
              borderDash: [5, 5],
              fill: false,
              tension: 0.3,
              pointRadius: 0,
              borderWidth: 1.5,
            },
            {
              label: 'Realizat (km)',
              data: actualVolumes.map(v => v.bikeTotal > 0 ? v.bikeTotal : null),
              borderColor: '#dc2626',
              backgroundColor: 'rgba(220, 38, 38, 0.1)',
              fill: true,
              tension: 0.3,
              pointRadius: 3,
              borderWidth: 2,
              spanGaps: true
            }
          ]
        },
        options: chartDefaults
      }));
    }

    // Training hours estimate
    const hoursCtx = page.querySelector('#hours-chart');
    if (hoursCtx) {
      charts.push(new Chart(hoursCtx, {
        type: 'bar',
        data: {
          labels: weekLabels,
          datasets: [{
            label: 'Ore estimate / săptămână',
            data: allVolumes.map(v => {
              // Rough estimates: swim=2min/100m, run=6min/km, bike=2.5min/km, gym=1h each, conditioning=0.75h
              const swimH = (v.swim * 2 / 100) / 60;
              const runH = (v.runTotal * 6) / 60;
              const bikeH = (v.bikeTotal * 2.5) / 60;
              const gymH = (v.gym || 0) * 1;
              return Math.round((swimH + runH + bikeH + gymH) * 10) / 10;
            }),
            backgroundColor: allVolumes.map(v => {
              const phase = PHASES.find(p => v.week >= p.weeks[0] && v.week <= p.weeks[1]);
              return phase ? phase.color + '99' : 'rgba(139,92,246,0.6)';
            }),
            borderRadius: 4,
          }]
        },
        options: {
          ...chartDefaults,
          scales: {
            ...chartDefaults.scales,
            y: { ...chartDefaults.scales.y, title: { display: true, text: 'ore', color: 'rgba(232,232,240,0.4)', font: { family: 'Inter', size: 11 } } }
          }
        }
      }));
    }
  }, 100);

  return page;
}
