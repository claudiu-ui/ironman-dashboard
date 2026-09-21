// ============================================
// Dashboard Page — Main Overview
// ============================================

import { getCurrentWeek, getDaysUntilRace, getCurrentPhase, getWeekVolume, getDynamicWeekSchedule, BENCHMARKS, RACE_TARGETS, PHASES, PLAN_START, isDeloadWeek, HR_ZONES } from './data.js';
import { storage } from './storage.js';
import { getFitnessMetrics } from './fitness.js';

export function renderDashboard() {
  const page = document.createElement('div');
  page.className = 'dashboard-page';

  const weekNum = getCurrentWeek();
  const phase = getCurrentPhase(weekNum);
  const daysLeft = getDaysUntilRace();
  const weekVolume = getWeekVolume(weekNum);
  const deload = isDeloadWeek(weekNum);

  // Calculate actual completed volume from logs
  const weekStartDate = new Date(PLAN_START);
  weekStartDate.setDate(PLAN_START.getDate() + (weekNum - 1) * 7);
  const weekLogs = storage.getWorkoutsForWeek(weekStartDate);
  
  let actualSwim = 0, actualBike = 0, actualRun = 0, actualGym = 0;
  let restDays = [];
  // Track completed sessions by date+type for calendar matching
  const completedSessions = {}; // { "2026-09-20_run": { workout data } }
  
  Object.entries(weekLogs).forEach(([date, dayLogs]) => {
    dayLogs.forEach(log => {
      const dist = parseFloat(log.distance) || 0;
      // Don't count skipped sessions towards volume
      if (!log.isSkipped) {
        if (log.type === 'swim') actualSwim += dist; 
        else if (log.type === 'run') actualRun += dist;
        else if (log.type === 'bike') actualBike += dist;
        else if (log.type === 'gym' || log.type === 'conditioning') actualGym += 1;
        else if (log.type === 'rest') restDays.push(date);
      }
      
      // Store for calendar matching
      const key = `${date}_${log.type}`;
      if (!completedSessions[key]) {
        completedSessions[key] = log;
      } else {
        // Merge if multiple of same type on same day (sum distance)
        completedSessions[key].distance = (parseFloat(completedSessions[key].distance) || 0) + dist;
        if (log.hr && (!completedSessions[key].hr || log.hr > completedSessions[key].hr)) {
          completedSessions[key].hr = log.hr;
        }
      }
    });
  });

  // Calculate Fatigue (3-day avg RPE)
  const todayDate = new Date();
  let rpeSum = 0, rpeCount = 0;
  for (let i = 0; i < 3; i++) {
    const d = new Date(todayDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dLog = storage.getDailyLog(dateStr);
    if (dLog.rpe) { rpeSum += dLog.rpe; rpeCount++; }
  }
  const avgRpe = rpeCount > 0 ? (rpeSum / rpeCount).toFixed(1) : 0;
  
  let fatigueHtml = '';
  if (avgRpe >= 8) {
    fatigueHtml = `<div class="fatigue-indicator high">🔴 Oboseală Critică (RPE: ${avgRpe}/10). Recomandare: Odihnă activă.</div>`;
  } else if (avgRpe >= 6) {
    fatigueHtml = `<div class="fatigue-indicator medium">🟡 Oboseală Medie (RPE: ${avgRpe}/10). Fii atent la recuperare.</div>`;
  } else if (avgRpe > 0) {
    fatigueHtml = `<div class="fatigue-indicator low">🟢 Proaspăt (RPE: ${avgRpe}/10). Bun de antrenament greu!</div>`;
  }

  // Today's day of week (0=Sun, 1=Mon, ...)
  const today = new Date();
  const todayDayIndex = today.getDay(); // 0=Sun
  const dayNames = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
  const todayName = dayNames[todayDayIndex];

  // Fitness Metrics Widget — renders async with real data
  const fitnessWidgetHtml = renderFitnessWidgetPlaceholder();
  // Async update after DOM renders
  setTimeout(() => loadAndRenderFitnessWidget(page), 0);

  page.innerHTML = `
    <div class="page-body">
      <!-- Hero Stats & Fatigue -->
      <div id="fitness-widget-container">${fitnessWidgetHtml}</div>
      <div class="stats-grid animate-in" style="margin-top: var(--space-md)">
        <div class="stat-card" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div class="stat-label">Săptămâna</div>
            <div class="stat-value" style="color: ${phase.color}">
              ${weekNum}<span style="font-size: 16px; color: var(--text-tertiary); font-weight: 400"> / 48</span>
            </div>
            <div class="stat-subtext">${deload ? '🔄 Deload Week' : phase.icon + ' ' + phase.name}</div>
          </div>
          <button id="open-weekly-report-btn" class="btn btn-primary" style="margin-top: 12px; width: 100%; font-size: 12px; padding: 6px 12px;">📊 Raport Săptămânal</button>
        </div>
        <div class="stat-card">
          <div class="stat-label">Până la Race Day</div>
          <div class="stat-value" style="background: var(--gradient-hero); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">
            ${daysLeft}
          </div>
          <div class="stat-subtext">zile rămase</div>
        </div>
        <div class="stat-card swim">
          <div class="stat-label">🏊 Înot / Săpt</div>
          <div class="stat-value">
            <span style="color: ${actualSwim >= (weekVolume.swim/1000) ? 'var(--success)' : 'inherit'}">${actualSwim.toFixed(1)}k</span> 
            <span style="font-size: 16px; color: var(--text-tertiary); font-weight: 400">/ ${weekVolume ? (weekVolume.swim / 1000).toFixed(1) + 'k' : '—'}</span>
          </div>
          <div class="stat-subtext">metri</div>
        </div>
        <div class="stat-card run">
          <div class="stat-label">🏃 Alergare / Săpt</div>
          <div class="stat-value">
            <span style="color: ${actualRun >= weekVolume.runTotal ? 'var(--success)' : 'inherit'}">${actualRun.toFixed(1)}</span> 
            <span style="font-size: 16px; color: var(--text-tertiary); font-weight: 400">/ ${weekVolume ? weekVolume.runTotal : '—'}</span>
          </div>
          <div class="stat-subtext">km total</div>
        </div>
        <div class="stat-card bike">
          <div class="stat-label">🚴 Bicicletă / Săpt</div>
          <div class="stat-value">
            <span style="color: ${actualBike >= weekVolume.bikeTotal ? 'var(--success)' : 'inherit'}">${actualBike.toFixed(1)}</span> 
            <span style="font-size: 16px; color: var(--text-tertiary); font-weight: 400">/ ${weekVolume ? weekVolume.bikeTotal : '—'}</span>
          </div>
          <div class="stat-subtext">km total</div>
        </div>
        <div class="stat-card gym">
          <div class="stat-label">🏋️ Sală / Săpt</div>
          <div class="stat-value">
            <span style="color: ${actualGym >= weekVolume.gym ? 'var(--success)' : 'inherit'}">${actualGym}x</span> 
            <span style="font-size: 16px; color: var(--text-tertiary); font-weight: 400">/ ${weekVolume ? weekVolume.gym + 'x' : '—'}</span>
          </div>
          <div class="stat-subtext">sesiuni</div>
        </div>
      </div>

      <!-- Phase Progress -->
      <div class="card animate-in animate-in-delay-1" style="margin-top: var(--space-lg)">
        <div class="card-header" style="cursor: pointer; justify-content: space-between; display: flex;" onclick="document.getElementById('phase-progress-content').style.display = document.getElementById('phase-progress-content').style.display === 'none' ? 'block' : 'none'; document.getElementById('phase-progress-toggle').textContent = document.getElementById('phase-progress-content').style.display === 'none' ? '▼' : '▲';">
          <div style="display: flex; align-items: center; gap: 8px;">
            <div class="card-title">Progresul pe Faze</div>
            <div class="card-badge">${phase.name}</div>
          </div>
          <span id="phase-progress-toggle" style="color: var(--text-tertiary); font-size: 12px; align-self: center;">▼</span>
        </div>
        <div class="phase-progress" id="phase-progress-content" style="display: none;">
          ${PHASES.map(p => {
            const totalWeeks = p.weeks[1] - p.weeks[0] + 1;
            const weeksIn = Math.max(0, Math.min(totalWeeks, weekNum - p.weeks[0] + 1));
            const pct = weekNum > p.weeks[1] ? 100 : weekNum < p.weeks[0] ? 0 : Math.round((weeksIn / totalWeeks) * 100);
            return `
              <div class="phase-row ${weekNum >= p.weeks[0] && weekNum <= p.weeks[1] ? 'current' : ''}">
                <div class="phase-info">
                  <span class="phase-icon">${p.icon}</span>
                  <span class="phase-name">${p.name}</span>
                  <span class="phase-weeks">Săpt ${p.weeks[0]}-${p.weeks[1]}</span>
                </div>
                <div class="phase-bar-container">
                  <div class="phase-bar">
                    <div class="phase-bar-fill" style="width: ${pct}%; background: ${p.color}"></div>
                  </div>
                  <span class="phase-pct">${pct}%</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Week Schedule with COMPLETED STATUS -->
      <div class="card animate-in animate-in-delay-2" style="margin-top: var(--space-lg)">
        <div class="card-header">
          <div class="card-title">📅 Programul Săptămânii ${weekNum} ${deload ? '(🔄 Deload)' : ''}</div>
          <div class="card-badge">${phase.description}</div>
        </div>
        <div class="week-schedule">
          ${(() => {
            const weekScheduleKey = `week_schedule_${weekNum}`;
            const currentSchedule = storage.get(weekScheduleKey) || getDynamicWeekSchedule(weekNum);

            return currentSchedule.map((day, dayIdx) => {
              const isToday = day.day === todayName;
              const dayDate = new Date(weekStartDate);
              dayDate.setDate(dayDate.getDate() + dayIdx);
              const dateStr = dayDate.toISOString().split('T')[0];
              const isRestDay = restDays.includes(dateStr);
              
              const plannedTypes = new Set(day.sessions.map(s => s.type));

              let html = `
                <div class="day-column" 
                     id="day-column-${dayIdx}"
                     ondragover="window.__handleDragOver(event)" 
                     ondragenter="window.__handleDragEnter(${dayIdx}, event)" 
                     ondragleave="window.__handleDragLeave(${dayIdx}, event)" 
                     ondrop="window.__handleDrop(${dayIdx}, event)">
                  <div class="day-header ${isToday ? 'today' : ''}">${day.day.substring(0, 3)}</div>
                  ${isRestDay ? `<div class="session-block rest-badge" style="background: rgba(239, 68, 68, 0.1); border-color: rgba(239, 68, 68, 0.3); color: var(--danger)">🤒 Odihnă</div>` : ''}
              `;

              // Morphing Logic: Match planned sessions to actual logs
              // 1. Gather all logs for this date
              let dayLogs = Object.keys(completedSessions)
                .filter(k => k.startsWith(dateStr))
                .map(k => completedSessions[k]);
              
              // 2. Clone sessions for rendering
              let renderSessions = day.sessions.map(s => ({ ...s }));
              
              // 3. First pass: exact type match
              renderSessions.forEach(s => {
                const matchIdx = dayLogs.findIndex(log => log.type === s.type);
                if (matchIdx !== -1) {
                  s._log = dayLogs[matchIdx];
                  dayLogs.splice(matchIdx, 1); // consumed
                }
              });

              // 4. Second pass: fuzzy match (morphing)
              // If we planned Conditioning but did Gym, we morph the Conditioning block into Gym
              renderSessions.forEach(s => {
                if (!s._log && dayLogs.length > 0) {
                  const log = dayLogs.shift();
                  s._log = log;
                  s._morphedTo = log.type;
                }
              });

              // Render sessions
              html += renderSessions.map((s, sessionIdx) => {
                const isCompleted = !!s._log;
                const completed = s._log;
                const isSkipped = completed && completed.isSkipped;
                
                // If morphed, use the new type's styles
                const renderType = s._morphedTo || s.type;
                const typeIcons = { run: '🏃', swim: '🏊', bike: '🚴', gym: '🏋️', conditioning: '💪', other: '🏅' };
                const renderIcon = s._morphedTo ? typeIcons[renderType] : s.icon;
                const renderTitle = s._morphedTo 
                  ? `${renderType.charAt(0).toUpperCase() + renderType.slice(1)} <span style="font-size:10px; color:var(--text-tertiary)">(în loc de ${s.title})</span>` 
                  : s.title;

                const actualDist = completed && !isSkipped ? parseFloat(completed.distance) || 0 : 0;
                const actualHr = completed && !isSkipped ? parseInt(completed.hr) || 0 : 0;
                const actualDuration = completed && !isSkipped ? parseInt(completed.duration) || 0 : 0;
                const actualPace = (actualDist > 0 && actualDuration > 0 && (renderType === 'run')) 
                  ? `${Math.floor(actualDuration / actualDist)}:${String(Math.round((actualDuration / actualDist % 1) * 60)).padStart(2, '0')}/km` 
                  : null;
                
                // Determine HR zone for completed workout
                let hrZoneLabel = '';
                if (actualHr > 0) {
                  const zone = HR_ZONES.find(z => actualHr >= z.bpmMin && actualHr <= z.bpmMax);
                  hrZoneLabel = zone ? `Z${zone.zone}` : '';
                }

                // Skipped styles
                const blockStyle = isSkipped 
                  ? `opacity: 0.4; filter: grayscale(100%); cursor: grab; transition: transform 0.2s; border: 1px dashed var(--border-subtle);`
                  : `${isRestDay ? 'opacity: 0.4;' : ''} cursor: grab; transition: transform 0.2s, filter 0.2s; ${isCompleted ? 'border-color: var(--success); box-shadow: 0 0 8px rgba(34, 197, 94, 0.15);' : ''} ${s._morphedTo ? 'border-style: dashed; border-color: var(--warning);' : ''}`;
                
                const badgeHtml = isSkipped 
                  ? `<span class="session-completed-badge" style="background: var(--danger); font-size: 10px; padding: 2px 4px; border-radius: 4px;">Skipped</span>`
                  : (isCompleted ? `<span class="session-completed-badge" ${s._morphedTo ? 'style="background: var(--warning);"' : ''}>${s._morphedTo ? '⚠️' : '✅'}</span>` : '');

                return `
                <div class="session-block ${renderType} ${isCompleted && !isSkipped ? 'completed' : ''}" 
                     title="${s.detail}" 
                     draggable="true"
                     ondragstart="window.__handleDragStart(${dayIdx}, ${sessionIdx}, event)"
                     style="${blockStyle}" 
                     onmouseover="${!isSkipped ? `this.style.filter='brightness(1.2)';` : ''}" 
                     onmouseout="${!isSkipped ? `this.style.filter='brightness(1)';` : ''}" 
                     onclick="window.openWorkoutDetails(${weekNum}, '${renderType}', '${s.title}', '${s.detail}', '${dateStr}')">
                  ${badgeHtml}
                  ${s.time ? `<span class="session-time">${s.time}</span>` : ''}
                  <span class="session-title">${renderIcon} ${isSkipped ? `<del>${renderTitle}</del>` : renderTitle}</span>
                  <span class="session-detail">${s._morphedTo ? (completed.notes || s.detail) : (isSkipped ? completed.notes : s.detail)}</span>
                  ${isCompleted && !isSkipped ? `
                    <div class="session-actual-data">
                      ${actualDist > 0 ? `<span class="actual-metric">${actualDist.toFixed(1)}km</span>` : ''}
                      ${actualDuration > 0 ? `<span class="actual-metric">${actualDuration}min</span>` : ''}
                      ${actualHr > 0 ? `<span class="actual-metric">❤️${actualHr} ${hrZoneLabel}</span>` : ''}
                      ${actualPace ? `<span class="actual-metric">⏱${actualPace}</span>` : ''}
                    </div>
                  ` : ''}
                </div>
                `;
              }).join('');

              // If there are STILL extra logs (e.g. planned 1 session, did 2)
              if (dayLogs.length > 0) {
                dayLogs.forEach(log => {
                   const typeIcons = { run: '🏃', swim: '🏊', bike: '🚴', gym: '🏋️', conditioning: '💪', other: '🏅' };
                   const title = log.type.charAt(0).toUpperCase() + log.type.slice(1) + ' (Extra)';
                   const actualDist = parseFloat(log.distance) || 0;
                   const actualHr = parseInt(log.hr) || 0;
                   const actualDuration = parseInt(log.duration) || 0;
                   
                   html += `
                   <div class="session-block ${log.type} completed" 
                        style="border-color: var(--info); border-style: dashed; box-shadow: 0 0 8px rgba(59, 130, 246, 0.15);" 
                        onclick="window.openWorkoutDetails(${weekNum}, '${log.type}', '${title}', '${log.notes || 'Fără detalii'}', '${dateStr}')">
                     <span class="session-completed-badge" style="background: var(--info);">➕</span>
                     <span class="session-title">${typeIcons[log.type] || '🏅'} ${title}</span>
                     <span class="session-detail">${log.notes || 'Sesiune extra'}</span>
                     <div class="session-actual-data">
                       ${actualDist > 0 ? `<span class="actual-metric">${actualDist.toFixed(1)}km</span>` : ''}
                       ${actualDuration > 0 ? `<span class="actual-metric">${actualDuration}min</span>` : ''}
                       ${actualHr > 0 ? `<span class="actual-metric">❤️${actualHr}</span>` : ''}
                     </div>
                   </div>
                   `;
                });
              }

              html += `</div>`;
              return html;
            }).join('');
          })()}
        </div>
      </div>

      <!-- Bottom Grid: Volume Details + Benchmarks -->
      <div class="grid-2 animate-in animate-in-delay-3" style="margin-top: var(--space-lg)">
        <!-- Volume Breakdown -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">📊 Detalii Volum — Săptămâna ${weekNum}</div>
          </div>
          ${weekVolume ? `
          <div class="volume-details">
            ${renderVolumeRow('🏊 Înot', [
              { label: 'Total', value: `${weekVolume.swim}m` },
              { label: 'Per sesiune', value: `~${weekVolume.swimPerSession || Math.round(weekVolume.swim / 3)}m` },
            ], 'swim')}
            ${renderVolumeRow('🏃 Alergare', [
              { label: 'Total', value: `${weekVolume.runTotal} km` },
              { label: 'Easy Run', value: `${weekVolume.easyRun || '—'} km` },
              { label: 'Long Run', value: `${weekVolume.longRun || '—'} km` },
              ...(weekVolume.brickRun ? [{ label: 'Brick Run', value: `${weekVolume.brickRun} km` }] : []),
            ], 'run')}
            ${renderVolumeRow('🚴 Bicicletă', [
              { label: 'Total', value: `${weekVolume.bikeTotal} km` },
              { label: weekVolume.tempoRide ? 'Tempo Ride' : 'Easy Ride', value: `${weekVolume.tempoRide || weekVolume.easyRide || '—'} km` },
              { label: 'Long Ride', value: `${weekVolume.longRide || '—'} km` },
            ], 'bike')}
            ${renderVolumeRow('🏋️ Sală', [
              { label: 'Sesiuni', value: `${weekVolume.gym}x` },
            ], 'gym')}
          </div>
          ` : '<p style="color: var(--text-tertiary)">Nu există date pentru această săptămână.</p>'}
        </div>

        <!-- Benchmarks -->
        <div class="card">
          <div class="card-header">
            <div class="card-title">🎯 Benchmark-uri</div>
          </div>
          <div class="benchmark-list">
            ${BENCHMARKS.map(b => {
              const benchmarkData = storage.getBenchmarks();
              const status = weekNum >= b.week ? (weekNum > b.week ? 'past' : 'current') : 'future';
              return b.tests.map((test, ti) => {
                const key = `w${b.week}_t${ti}`;
                const passed = benchmarkData[key] || false;
                return `
                  <div class="benchmark-item" data-week="${b.week}" data-test="${ti}">
                    <div class="benchmark-check ${passed ? 'passed' : status === 'current' ? 'current' : ''}" onclick="window.__toggleBenchmark(${b.week}, ${ti}, this)">
                      ${passed ? '✓' : status === 'current' ? '◉' : ''}
                    </div>
                    <div class="benchmark-week">Săpt ${b.week}</div>
                    <div class="benchmark-text">${test}</div>
                  </div>
                `;
              }).join('');
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Race Targets -->
      <div class="card animate-in animate-in-delay-4" style="margin-top: var(--space-lg)">
        <div class="card-header">
          <div class="card-title">🏁 Target-uri Race Day</div>
          <div class="card-badge">Total: ${RACE_TARGETS.total}</div>
        </div>
        <div class="race-targets-grid">
          <div class="race-target swim-target">
            <div class="race-target-icon">🏊</div>
            <div class="race-target-distance">${RACE_TARGETS.swim.distance}</div>
            <div class="race-target-time">${RACE_TARGETS.swim.target}</div>
          </div>
          <div class="race-target-arrow">→</div>
          <div class="race-target bike-target">
            <div class="race-target-icon">🚴</div>
            <div class="race-target-distance">${RACE_TARGETS.bike.distance}</div>
            <div class="race-target-time">${RACE_TARGETS.bike.target}</div>
          </div>
          <div class="race-target-arrow">→</div>
          <div class="race-target run-target">
            <div class="race-target-icon">🏃</div>
            <div class="race-target-distance">${RACE_TARGETS.run.distance}</div>
            <div class="race-target-time">${RACE_TARGETS.run.target}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // ── Weekly Report: data gathering ──────────────────────────────────────
  const plannedSwim = weekVolume ? weekVolume.swim / 1000 : 0;
  const plannedRun  = weekVolume ? weekVolume.runTotal : 0;
  const plannedBike = weekVolume ? weekVolume.bikeTotal : 0;
  const plannedGym  = weekVolume ? weekVolume.gym : 0;

  // Previous week data
  const prevWeekNum = weekNum - 1;
  const prevWeekVolume = getWeekVolume(prevWeekNum);
  let prevSwim = 0, prevRun = 0, prevBike = 0, prevGym = 0;
  if (prevWeekNum >= 1) {
    const prevWeekStart = new Date(PLAN_START);
    prevWeekStart.setDate(PLAN_START.getDate() + (prevWeekNum - 1) * 7);
    const prevLogs = storage.getWorkoutsForWeek(prevWeekStart);
    Object.values(prevLogs).forEach(dayLogs => {
      dayLogs.forEach(log => {
        if (log.isSkipped) return;
        const d = parseFloat(log.distance) || 0;
        if (log.type === 'swim') prevSwim += d;
        else if (log.type === 'run') prevRun += d;
        else if (log.type === 'bike') prevBike += d;
        else if (log.type === 'gym' || log.type === 'conditioning') prevGym += 1;
      });
    });
  }

  // Biometrics: this week avg RPE, sleep, latest weight
  let rpeVals = [], sleepVals = [], weights = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStartDate);
    d.setDate(weekStartDate.getDate() + i);
    const dStr = d.toISOString().split('T')[0];
    const log = storage.getDailyLog(dStr);
    if (log.rpe > 0) rpeVals.push(log.rpe);
    if (log.sleep > 0) sleepVals.push(log.sleep);
    if (log.weight > 0) weights.push(log.weight);
  }
  const weekAvgRpe = rpeVals.length ? (rpeVals.reduce((a,b)=>a+b,0)/rpeVals.length).toFixed(1) : '—';
  const weekAvgSleep = sleepVals.length ? (sleepVals.reduce((a,b)=>a+b,0)/sleepVals.length).toFixed(1) : '—';
  const latestWeight = weights.length ? weights[weights.length - 1] : '—';

  // Helper functions
  const pct = (a, p) => p > 0 ? Math.min(200, Math.round((a / p) * 100)) : 0;
  const compColor = (a, p) => a >= p ? '#22c55e' : a >= p * 0.8 ? '#f97316' : '#ef4444';
  const delta = (cur, prev) => {
    if (!prev) return { str: '—', color: 'var(--text-tertiary)', icon: '→' };
    const diff = cur - prev;
    const diffPct = Math.round((diff / prev) * 100);
    if (Math.abs(diffPct) < 2) return { str: `≈ ${prev.toFixed ? prev.toFixed(1) : prev}`, color: 'var(--text-secondary)', icon: '→' };
    return diff > 0
      ? { str: `+${diffPct}% vs S${prevWeekNum}`, color: '#22c55e', icon: '↑' }
      : { str: `${diffPct}% vs S${prevWeekNum}`, color: '#ef4444', icon: '↓' };
  };

  const swimPct  = pct(actualSwim, plannedSwim);
  const runPct   = pct(actualRun, plannedRun);
  const bikePct  = pct(actualBike, plannedBike);
  const gymPct   = pct(actualGym, plannedGym);
  const overallScore = Math.min(100, Math.round((swimPct + runPct + bikePct + gymPct) / 4));

  const swimDelta = delta(actualSwim, prevSwim);
  const runDelta  = delta(actualRun, prevRun);
  const bikeDelta = delta(actualBike, prevBike);
  const gymDelta  = delta(actualGym, prevGym);

  // Score grade
  const grade = overallScore >= 95 ? { label: 'EXCEPȚIONAL', color: '#22c55e', emoji: '🏆' }
    : overallScore >= 80 ? { label: 'BINE', color: '#f97316', emoji: '💪' }
    : overallScore >= 60 ? { label: 'ACCEPTABIL', color: '#eab308', emoji: '⚡' }
    : { label: 'SUB TARGET', color: '#ef4444', emoji: '⚠️' };

  // Next week plan
  const nextWeekNum = weekNum + 1;
  const nextVol = getWeekVolume(nextWeekNum);
  const nextDeload = isDeloadWeek(nextWeekNum);
  const nextPhase = getCurrentPhase(nextWeekNum);

  // Coaching tips based on data
  const coachingTips = [];
  if (swimPct < 80) coachingTips.push({ icon: '🏊', tip: `Înotul tău a fost la ${swimPct}% din plan. Încearcă să nu ratezi sesiunile de dimineață — sunt cel mai greu de compensat ulterior.` });
  if (runPct < 80) coachingTips.push({ icon: '🏃', tip: `Run-ul e sub target (${runPct}%). La Ironman, alergarea e disciplina în care poți pierde sau câștiga cel mai mult timp.` });
  if (bikePct < 80) coachingTips.push({ icon: '🚴', tip: `Ciclismul la ${bikePct}% — atenție că long ride-urile de weekend sunt fundamentul aerob al planului.` });
  if (weekAvgRpe !== '—' && parseFloat(weekAvgRpe) > 7) coachingTips.push({ icon: '❤️', tip: `RPE mediu de ${weekAvgRpe}/10 indică acumulare mare de oboseală. Prioritizează somnul și nutriția post-antrenament.` });
  if (weekAvgSleep !== '—' && parseFloat(weekAvgSleep) < 7) coachingTips.push({ icon: '😴', tip: `Dormi în medie ${weekAvgSleep}h — sub cele 8h recomandate. Somnul e cel mai important "supliment" al tău.` });
  if (nextDeload) coachingTips.push({ icon: '🔄', tip: `Săptămâna ${nextWeekNum} este DELOAD. Nu te ambiționa să adaugi volum — corpul tău are nevoie de recuperare activă.` });
  if (overallScore >= 90) coachingTips.push({ icon: '🎯', tip: `Săptămână excelentă! Menține consistența — la Ironman, consistența bate intensitatea pe termen lung.` });
  if (coachingTips.length === 0) coachingTips.push({ icon: '💡', tip: `Menține ritmul și concentrează-te pe calitatea somnului și nutriția post-antrenament pentru recuperare optimă.` });

  function progressBar(pct, color) {
    const w = Math.min(100, pct);
    return `<div style="height:6px;background:rgba(255,255,255,0.08);border-radius:3px;margin-top:8px;overflow:hidden;">
      <div style="height:100%;width:${w}%;background:${color};border-radius:3px;transition:width 0.6s ease;"></div>
    </div>`;
  }

  function disciplineCard(icon, label, actual, planned, unit, pctVal, del, color) {
    return `
      <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:14px;border-left:4px solid ${color};">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="font-size:12px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.05em;">${icon} ${label}</div>
          <div style="font-size:11px;color:${del.color};">${del.icon} ${del.str}</div>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-top:8px;">
          <div style="font-size:22px;font-weight:700;color:${compColor(actual, planned)}">${typeof actual === 'number' ? (unit === 'x' ? actual + unit : actual.toFixed(1) + unit) : actual}</div>
          <div style="font-size:12px;color:var(--text-secondary);">din ${typeof planned === 'number' ? (unit === 'x' ? planned + unit : planned + unit) : planned}</div>
        </div>
        ${progressBar(pctVal, compColor(actual, planned))}
        <div style="font-size:11px;color:var(--text-tertiary);margin-top:4px;text-align:right;">${pctVal}%</div>
      </div>`;
  }

  page.innerHTML += `
    <div class="modal-overlay" id="weekly-report-modal">
      <div class="modal" style="max-width:680px;padding:0;overflow:hidden;">
        
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1a0505 0%,#2d0a0a 100%);padding:24px 28px;border-bottom:1px solid var(--border-subtle);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;">
            <div>
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-tertiary);margin-bottom:4px;">Raport Complet</div>
              <h2 style="margin:0;font-size:22px;">Săptămâna ${weekNum} — ${phase.name}</h2>
              <div style="font-size:12px;color:var(--text-secondary);margin-top:4px;">${deload ? '🔄 Săptămână de Deload' : phase.description}</div>
            </div>
            <div style="text-align:center;background:rgba(255,255,255,0.05);border-radius:12px;padding:12px 20px;border:1px solid var(--border-medium);">
              <div style="font-size:36px;font-weight:800;color:${grade.color};">${overallScore}</div>
              <div style="font-size:10px;color:${grade.color};font-weight:700;letter-spacing:0.08em;">${grade.emoji} ${grade.label}</div>
            </div>
          </div>
        </div>

        <div style="padding:24px 28px;max-height:70vh;overflow-y:auto;">
          
          <!-- Section 1: Execuție -->
          <div style="margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;margin-bottom:12px;">① Execuție vs Plan</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
              ${disciplineCard('🏊', 'Înot', actualSwim, plannedSwim, 'km', swimPct, swimDelta, '#06b6d4')}
              ${disciplineCard('🚴', 'Bicicletă', actualBike, plannedBike, 'km', bikePct, bikeDelta, '#f97316')}
              ${disciplineCard('🏃', 'Alergare', actualRun, plannedRun, 'km', runPct, runDelta, '#22c55e')}
              ${disciplineCard('🏋️', 'Sală', actualGym, plannedGym, 'x', gymPct, gymDelta, '#a855f7')}
            </div>
          </div>

          <!-- Section 2: Biometrics -->
          <div style="margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;margin-bottom:12px;">② Indicatori Corp</div>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
              <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:14px;text-align:center;">
                <div style="font-size:11px;color:var(--text-tertiary);">RPE Mediu</div>
                <div style="font-size:28px;font-weight:700;margin:4px 0;color:${weekAvgRpe === '—' ? 'var(--text-tertiary)' : parseFloat(weekAvgRpe) > 7 ? '#ef4444' : parseFloat(weekAvgRpe) > 5 ? '#f97316' : '#22c55e'}">${weekAvgRpe}</div>
                <div style="font-size:10px;color:var(--text-tertiary);">din 10</div>
              </div>
              <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:14px;text-align:center;">
                <div style="font-size:11px;color:var(--text-tertiary);">Somn Mediu</div>
                <div style="font-size:28px;font-weight:700;margin:4px 0;color:${weekAvgSleep === '—' ? 'var(--text-tertiary)' : parseFloat(weekAvgSleep) >= 8 ? '#22c55e' : parseFloat(weekAvgSleep) >= 7 ? '#f97316' : '#ef4444'}">${weekAvgSleep}</div>
                <div style="font-size:10px;color:var(--text-tertiary);">ore / noapte</div>
              </div>
              <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:14px;text-align:center;">
                <div style="font-size:11px;color:var(--text-tertiary);">Greutate</div>
                <div style="font-size:28px;font-weight:700;margin:4px 0;color:var(--text-primary);">${latestWeight}</div>
                <div style="font-size:10px;color:var(--text-tertiary);">kg (ultimul log)</div>
              </div>
            </div>
            ${weekAvgRpe === '—' ? `<div style="font-size:11px;color:var(--text-tertiary);margin-top:8px;text-align:center;">💡 Loghează RPE și somnul zilnic din Nutriție pentru a vedea datele aici</div>` : ''}
          </div>

          <!-- Section 3: Săptămâna viitoare -->
          ${nextVol ? `
          <div style="margin-bottom:24px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;margin-bottom:12px;">③ Plan Săptămâna ${nextWeekNum} ${nextDeload ? '🔄 DELOAD' : ''}</div>
            <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:16px;">
              <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;text-align:center;">
                <div>
                  <div style="font-size:10px;color:var(--text-tertiary);">🏊 Înot</div>
                  <div style="font-size:18px;font-weight:700;margin-top:4px;">${(nextVol.swim/1000).toFixed(1)}<span style="font-size:11px;color:var(--text-secondary);">km</span></div>
                  <div style="font-size:10px;color:${nextVol.swim > weekVolume.swim ? '#22c55e' : nextVol.swim < weekVolume.swim ? '#ef4444' : 'var(--text-tertiary)'};">${nextVol.swim > weekVolume.swim ? '↑' : nextVol.swim < weekVolume.swim ? '↓' : '='} vs azi</div>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--text-tertiary);">🚴 Bike</div>
                  <div style="font-size:18px;font-weight:700;margin-top:4px;">${nextVol.bikeTotal}<span style="font-size:11px;color:var(--text-secondary);">km</span></div>
                  <div style="font-size:10px;color:${nextVol.bikeTotal > weekVolume.bikeTotal ? '#22c55e' : nextVol.bikeTotal < weekVolume.bikeTotal ? '#ef4444' : 'var(--text-tertiary)'};">${nextVol.bikeTotal > weekVolume.bikeTotal ? '↑' : nextVol.bikeTotal < weekVolume.bikeTotal ? '↓' : '='} vs azi</div>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--text-tertiary);">🏃 Run</div>
                  <div style="font-size:18px;font-weight:700;margin-top:4px;">${nextVol.runTotal}<span style="font-size:11px;color:var(--text-secondary);">km</span></div>
                  <div style="font-size:10px;color:${nextVol.runTotal > weekVolume.runTotal ? '#22c55e' : nextVol.runTotal < weekVolume.runTotal ? '#ef4444' : 'var(--text-tertiary)'};">${nextVol.runTotal > weekVolume.runTotal ? '↑' : nextVol.runTotal < weekVolume.runTotal ? '↓' : '='} vs azi</div>
                </div>
                <div>
                  <div style="font-size:10px;color:var(--text-tertiary);">🏋️ Sală</div>
                  <div style="font-size:18px;font-weight:700;margin-top:4px;">${nextVol.gym}<span style="font-size:11px;color:var(--text-secondary);">x</span></div>
                  <div style="font-size:10px;color:var(--text-tertiary);">sesiuni</div>
                </div>
              </div>
            </div>
          </div>
          ` : ''}

          <!-- Section 4: Coaching Notes -->
          <div style="margin-bottom:8px;">
            <div style="font-size:11px;font-weight:700;letter-spacing:0.08em;color:var(--accent);text-transform:uppercase;margin-bottom:12px;">④ Note Coach</div>
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${coachingTips.map(t => `
                <div style="background:var(--bg-glass);border-radius:var(--radius-md);padding:12px 16px;display:flex;gap:12px;align-items:flex-start;border:1px solid var(--border-subtle);">
                  <span style="font-size:18px;flex-shrink:0;">${t.icon}</span>
                  <span style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${t.tip}</span>
                </div>
              `).join('')}
            </div>
          </div>

        </div>

        <!-- Footer -->
        <div style="padding:16px 28px;border-top:1px solid var(--border-subtle);display:flex;justify-content:space-between;align-items:center;background:var(--bg-secondary);">
          <div style="font-size:12px;color:var(--text-tertiary);">Săptămâna ${weekNum} / 48 · ${daysLeft} zile până la Race Day</div>
          <button class="btn btn-primary" id="close-weekly-report-btn" style="min-width:100px;">Închide</button>
        </div>
      </div>
    </div>
  `;

  // Attach Event Listeners
  const openBtn = page.querySelector('#open-weekly-report-btn');
  const closeBtn = page.querySelector('#close-weekly-report-btn');
  const modal = page.querySelector('#weekly-report-modal');

  if (openBtn && modal) {
    openBtn.addEventListener('click', () => modal.classList.add('active'));
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
  }
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  }

  return page;
}

function renderVolumeRow(label, items, type) {
  return `
    <div class="volume-row ${type}">
      <div class="volume-row-label">${label}</div>
      <div class="volume-row-values">
        ${items.map(item => `
          <div class="volume-item">
            <span class="volume-item-label">${item.label}</span>
            <span class="volume-item-value">${item.value}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// ── Fitness Widget: Skeleton placeholder ──────────────────────────────────
function renderFitnessWidgetPlaceholder() {
  return `
    <div class="card animate-in" style="background: linear-gradient(145deg, #1a1a1a 0%, #111 100%); border: 1px solid var(--border-subtle); margin-bottom: var(--space-md); padding: 20px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <div style="width:8px;height:8px;border-radius:50%;background:var(--accent);animation: pulse 1.5s infinite;"></div>
          <span style="font-size:13px;font-weight:600;letter-spacing:0.03em;">Se încarcă metricile...</span>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        ${['CTL — Fitness','ATL — Oboseală','TSB — Formă'].map(l => `
          <div style="background:rgba(255,255,255,0.03);border-radius:10px;padding:14px;text-align:center;">
            <div style="font-size:10px;color:var(--text-tertiary);margin-bottom:8px;">${l}</div>
            <div style="height:32px;background:rgba(255,255,255,0.06);border-radius:6px;animation:pulse 1.5s infinite;"></div>
          </div>
        `).join('')}
      </div>
    </div>`;
}

// ── Fitness Widget: Real data renderer ────────────────────────────────────
async function loadAndRenderFitnessWidget(page) {
  const container = page.querySelector('#fitness-widget-container');
  if (!container) return;

  try {
    const m = await getFitnessMetrics();
    if (!m) {
      container.innerHTML = `
        <div class="card" style="background:linear-gradient(145deg,#1a1a1a,#111);border:1px solid var(--border-subtle);margin-bottom:var(--space-md);padding:16px 20px;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:20px;">📊</span>
            <div>
              <div style="font-weight:600;font-size:14px;">Nicio activitate logată încă</div>
              <div style="font-size:12px;color:var(--text-tertiary);margin-top:2px;">Loghează primul antrenament sau conectează Intervals.icu din Setări</div>
            </div>
          </div>
        </div>`;
      return;
    }

    const { ctl, atl, tsb, weeklyTSS, prevWeeklyTSS, ctlDelta, atlDelta, tsbDelta, ctlMonthDelta, source } = m;

    const tsbColor = tsb >= 5 ? '#22c55e' : tsb >= -10 ? '#f97316' : '#ef4444';
    const tsbIcon = tsb <= -20 ? '🔴' : tsb <= -10 ? '🟡' : tsb <= 5 ? '🟢' : '🚀';
    const tsbLabel = tsb <= -20 ? 'Risc Overtraining'
      : tsb <= -10 ? 'Heavy Load — Productiv'
      : tsb <= 5 ? 'Formă Optimă'
      : 'Peak Form / Taper';

    const tsbAdvice = tsb <= -20
      ? 'Oboseala acută îți depășește masiv baza. <b>Zi de recuperare azi</b> — fără efort intens.'
      : tsb <= -10
      ? `TSB de <b>${tsb}</b> = mediu perfect de acumulare (Build). Musculatura e încărcată — normal! Prioritizează nutriția post-antrenament și somnul.`
      : tsb <= 5
      ? `Echilibru perfect între fitness și oboseală. Ești pregătit pentru antrenamente de calitate — intervale, long run, brick workouts.`
      : `Oboseala a dispărut, fitness-ul a rămas! Ești în formă maximă. Dacă ai cursă în weekend — e momentul.`;

    const tssChange = prevWeeklyTSS > 0 ? Math.round(((weeklyTSS - prevWeeklyTSS) / prevWeeklyTSS) * 100) : 0;
    const tssChangeStr = tssChange > 0 ? `+${tssChange}%` : `${tssChange}%`;
    const tssChangeColor = tssChange > 10 ? '#ef4444' : tssChange > 0 ? '#f97316' : tssChange < -15 ? '#22c55e' : 'var(--text-secondary)';

    const delta = (val, unit = '') => val === 0 ? `<span style="color:var(--text-tertiary)">→ stabil</span>`
      : val > 0 ? `<span style="color:#22c55e">↑ +${val}${unit}</span>`
      : `<span style="color:#ef4444">↓ ${val}${unit}</span>`;

    function miniBar(val, max, color) {
      const pct = Math.min(100, Math.round((val / max) * 100));
      return `<div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:6px;"><div style="height:100%;width:${pct}%;background:${color};border-radius:2px;"></div></div>`;
    }

    container.innerHTML = `
      <div class="card animate-in" style="background:linear-gradient(145deg,#1a1a1a 0%,#0f0f0f 100%);border:1px solid var(--border-subtle);margin-bottom:var(--space-md);">
        
        <!-- Header -->
        <div style="display:flex;justify-content:space-between;align-items:center;padding:16px 20px 0;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;border-radius:50%;background:${source === 'intervals' ? 'var(--success)' : '#3b82f6'};box-shadow:0 0 8px ${source === 'intervals' ? 'var(--success)' : '#3b82f6'};"></div>
            <span style="font-size:12px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;">
              ${source === 'intervals' ? 'Intervals.icu — Date Reale' : 'Fitness Local — Calcul din Loguri'}
            </span>
          </div>
          <button onclick="window._refreshFitnessWidget()" style="background:none;border:none;color:var(--text-tertiary);font-size:11px;cursor:pointer;padding:4px 8px;border-radius:4px;border:1px solid var(--border-subtle);">
            🔄 Refresh
          </button>
        </div>

        <!-- Main metrics grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:1px;background:var(--border-subtle);margin:16px 0 0;border-top:1px solid var(--border-subtle);border-bottom:1px solid var(--border-subtle);">
          
          <!-- CTL -->
          <div style="background:#0f0f0f;padding:16px 14px;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">CTL — Fitness</div>
            <div style="font-size:32px;font-weight:800;color:#3b82f6;line-height:1;">${ctl}</div>
            <div style="font-size:11px;margin-top:4px;">${delta(ctlDelta)} vs 7z</div>
            ${miniBar(ctl, 150, '#3b82f6')}
            <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">${delta(ctlMonthDelta)} vs 30z</div>
          </div>

          <!-- ATL -->
          <div style="background:#0f0f0f;padding:16px 14px;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">ATL — Oboseală</div>
            <div style="font-size:32px;font-weight:800;color:#ef4444;line-height:1;">${atl}</div>
            <div style="font-size:11px;margin-top:4px;">${delta(atlDelta)} vs 7z</div>
            ${miniBar(atl, 150, '#ef4444')}
            <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">oboseală acută (7z)</div>
          </div>

          <!-- TSB -->
          <div style="background:#0f0f0f;padding:16px 14px;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">TSB — Formă</div>
            <div style="font-size:32px;font-weight:800;color:${tsbColor};line-height:1;">${tsb > 0 ? '+' : ''}${tsb}</div>
            <div style="font-size:11px;margin-top:4px;">${tsbIcon} ${tsbLabel}</div>
            <div style="height:4px;background:rgba(255,255,255,0.06);border-radius:2px;margin-top:6px;position:relative;">
              <div style="position:absolute;left:50%;top:-1px;width:2px;height:6px;background:rgba(255,255,255,0.2);border-radius:1px;"></div>
              <div style="height:100%;width:${Math.min(100, Math.max(0, 50 + tsb))}%;background:${tsbColor};border-radius:2px;"></div>
            </div>
          </div>

          <!-- TSS Saptamana -->
          <div style="background:#0f0f0f;padding:16px 14px;">
            <div style="font-size:10px;color:var(--text-tertiary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:6px;">TSS Săptămâna</div>
            <div style="font-size:32px;font-weight:800;color:#a855f7;line-height:1;">${weeklyTSS}</div>
            <div style="font-size:11px;margin-top:4px;color:${tssChangeColor};">${tssChange !== 0 ? tssChangeStr : '→'} vs săpt. ant.</div>
            ${miniBar(weeklyTSS, 800, '#a855f7')}
            <div style="font-size:10px;color:var(--text-tertiary);margin-top:4px;">săpt. ant.: ${prevWeeklyTSS}</div>
          </div>
        </div>

        <!-- Coaching Insight -->
        <div style="padding:14px 20px;display:flex;gap:12px;align-items:flex-start;">
          <span style="font-size:20px;flex-shrink:0;">${tsbIcon}</span>
          <div>
            <div style="font-size:13px;font-weight:600;margin-bottom:4px;">${tsbLabel}</div>
            <div style="font-size:12px;color:var(--text-secondary);line-height:1.6;">${tsbAdvice}</div>
          </div>
        </div>
      </div>`;

    // Wire refresh button
    window._refreshFitnessWidget = async () => {
      container.innerHTML = renderFitnessWidgetPlaceholder();
      await getFitnessMetrics(true); // force refresh
      loadAndRenderFitnessWidget(page);
    };

  } catch (e) {
    console.error('Fitness widget error:', e);
    container.innerHTML = `<div style="padding:12px;color:var(--text-tertiary);font-size:12px;">⚠️ Eroare la încărcarea metricilor: ${e.message}</div>`;
  }
}
