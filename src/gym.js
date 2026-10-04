// ============================================
// Gym Page — Exercise Programs (Editable + Progressive Overload)
// ============================================

import { GYM_PROGRAMS, PLAN_START, getCurrentWeek, getDynamicWeekSchedule } from './data.js';
import { storage } from './storage.js';

let isEditMode = false;
let currentPrograms = null;

export function renderGymPage(forceDateStr = null) {
  const page = document.createElement('div');
  page.className = 'gym-page animate-in';
  
  // Load programs from storage or fallback to defaults
  currentPrograms = storage.getCustomGymPrograms(GYM_PROGRAMS);
  
  // Dynamically find scheduled dates for gym sessions
  const weekNum = getCurrentWeek(forceDateStr);
  const weekScheduleKey = `week_schedule_${weekNum}`;
  const currentSchedule = storage.get(weekScheduleKey) || getDynamicWeekSchedule(weekNum);
  
  const weekStartDate = new Date(PLAN_START);
  weekStartDate.setDate(PLAN_START.getDate() + (weekNum - 1) * 7);

  const defaultDateStr = forceDateStr || new Date().toISOString().split('T')[0];
  const scheduledDates = { lower: defaultDateStr, upper1: defaultDateStr, upper2: defaultDateStr, conditioning: defaultDateStr, accesorii: defaultDateStr };
  const scheduledDays = { lower: 'Nelogat', upper1: 'Nelogat', upper2: 'Nelogat', conditioning: 'Nelogat', accesorii: 'Nelogat' };

  currentSchedule.forEach((day, dayIdx) => {
    const dayDate = new Date(weekStartDate);
    dayDate.setDate(dayDate.getDate() + dayIdx);
    const dateStr = dayDate.toISOString().split('T')[0];
    
    day.sessions.forEach(s => {
      if (s.type === 'gym' && s.title.includes('Lower')) {
        scheduledDates.lower = dateStr; scheduledDays.lower = day.day;
      } else if (s.type === 'gym' && s.title.includes('Upper 1')) {
        scheduledDates.upper1 = dateStr; scheduledDays.upper1 = day.day;
      } else if (s.type === 'gym' && s.title.includes('Upper 2')) {
        scheduledDates.upper2 = dateStr; scheduledDays.upper2 = day.day;
      } else if (s.type === 'gym' && s.title.includes('Accesorii')) {
        scheduledDates.accesorii = dateStr; scheduledDays.accesorii = day.day;
      } else if (s.type === 'conditioning') {
        scheduledDates.conditioning = dateStr; scheduledDays.conditioning = day.day;
      }
    });
  });

  currentPrograms.lower.day = scheduledDays.lower;
  currentPrograms.upper1.day = scheduledDays.upper1;
  currentPrograms.upper2.day = scheduledDays.upper2;
  currentPrograms.conditioning.day = scheduledDays.conditioning;
  currentPrograms.accesorii.day = scheduledDays.accesorii;

  function render() {
    page.innerHTML = `
      <div class="page-body">
        <div class="gym-intro animate-in" style="display: flex; justify-content: flex-end; align-items: center; margin-bottom: var(--space-lg);">
          <button class="btn btn-ghost" id="toggle-edit-mode">
            ${isEditMode ? '💾 Salvează Programul' : '✏️ Editează Programul'}
          </button>
        </div>

        <!-- Gym Program Cards -->
        <div class="grid-2" style="margin-bottom: var(--space-lg); align-items: start;">
          ${renderGymCard(currentPrograms.lower, 'lower', scheduledDates.lower)}
          ${renderConditioningCard(currentPrograms.conditioning, scheduledDates.conditioning)}
        </div>
        <div class="grid-2" style="margin-bottom: var(--space-lg); align-items: start;">
          ${renderGymCard(currentPrograms.upper1, 'upper1', scheduledDates.upper1)}
          ${renderGymCard(currentPrograms.upper2, 'upper2', scheduledDates.upper2)}
        </div>
        <div class="grid-2" style="align-items: start;">
          ${renderGymCard(currentPrograms.accesorii, 'accesorii', scheduledDates.accesorii)}
        </div>
      </div>
    `;
    attachEvents();
  }

  function getLastSessionData(sessionKey, exerciseName, exerciseIndex, currentDateStr) {
    const gymLogs = storage.get('gym', {});
    const dates = Object.keys(gymLogs).sort().reverse();
    
    // DEBUG LOG FOR USER TO CHECK
    console.log(`getLastSessionData for ${sessionKey} - ${exerciseName} (index ${exerciseIndex}), currentDate: ${currentDateStr}. Available dates:`, dates);
    
    for (const date of dates) {
      if (date >= currentDateStr) continue; // Skip current planned date AND future dates
      const session = gymLogs[date]?.[sessionKey];
      if (session) {
        // Handle potentially corrupted data (nested exercises object)
        const exercisesArr = Array.isArray(session.exercises) 
          ? session.exercises 
          : (session.exercises && Array.isArray(session.exercises.exercises) ? session.exercises.exercises : null);
          
        if (exercisesArr) {
          let ex = exercisesArr.find(e => e.name === exerciseName);
          if (!ex) {
            const exNameLower = exerciseName.toLowerCase();
            ex = exercisesArr.find(e => e.name && (e.name.toLowerCase().includes(exNameLower) || exNameLower.includes(e.name.toLowerCase())));
          }
          if (!ex && exercisesArr.length > exerciseIndex) {
            ex = exercisesArr[exerciseIndex];
          }

          if (ex && ex.sets && ex.sets.length > 0) {
            console.log(`Found past session for ${exerciseName} on date ${date}:`, ex);
            return ex;
          }
        }
      }
    }
    console.log(`No past session found for ${exerciseName}`);
    return null;
  }

  function renderGymCard(program, key, dateStr) {
    const logged = storage.getGymSession(dateStr, key);
    const isCollapsed = localStorage.getItem(`gym_collapsed_${key}`) === 'true';
    return `
      <div class="card animate-in">
        <div class="card-header" style="align-items: flex-start;">
          <div style="flex: 1; margin-right: 12px; cursor: ${isEditMode ? 'default' : 'pointer'};" class="${isEditMode ? '' : 'gym-card-toggle'}" data-key="${key}">
            ${isEditMode ? `
              <input type="text" class="form-input edit-prog-name" data-session="${key}" value="${program.name}" style="font-size: 14px; font-weight: bold; width: 100%; margin-bottom: 4px; padding: 4px 8px; text-transform: uppercase;" />
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="font-size: 12px; color: var(--text-tertiary); white-space: nowrap;">${program.day} •</span>
                <input type="text" class="form-input edit-prog-focus" data-session="${key}" value="${program.focus || ''}" style="font-size: 12px; width: 100%; padding: 2px 8px;" placeholder="Focus (ex: Piept, Umeri)" />
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="card-title">${program.name}</div>
                <div class="toggle-icon" id="toggle-icon-${key}" style="font-size: 12px; color: var(--text-tertiary);">${isCollapsed ? '▼' : '▲'}</div>
              </div>
              <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 2px">${program.day} • ${program.focus}</div>
            `}
          </div>
          ${!isEditMode ? `
            <button class="btn btn-sm ${logged ? 'btn-ghost' : 'btn-primary'} log-gym-btn" data-session="${key}" data-date="${dateStr}">
              ${logged ? '✏️ Editează' : '📝 Loghează Sesiune'}
            </button>
          ` : ''}
        </div>
        <div id="exercises-container-${key}" style="display: ${isCollapsed && !isEditMode ? 'none' : 'block'};">
        ${isEditMode ? `
          <div style="margin-bottom: var(--space-md);">
            <input type="text" class="form-input edit-prog-notes" data-session="${key}" value="${program.notes || ''}" placeholder="Note generale (ex: RIR 3-4...)" style="width: 100%; padding: 6px 12px; border: 1px dashed var(--warning); border-radius: var(--radius-md);" />
          </div>
        ` : (program.notes ? `<div style="font-size: 12px; color: var(--warning); margin-bottom: var(--space-md); padding: 8px 12px; background: rgba(234,179,8,0.08); border-radius: var(--radius-md);">${program.notes}</div>` : '')}
        
        <div class="gym-exercises" id="exercises-${key}">
          ${program.exercises.map((ex, i) => {
            const lastSession = getLastSessionData(key, ex.name, i, dateStr);
            let loggedEx = null;
            if (logged) {
              const exercisesArr = Array.isArray(logged.exercises) 
                ? logged.exercises 
                : (logged.exercises && Array.isArray(logged.exercises.exercises) ? logged.exercises.exercises : []);
              loggedEx = exercisesArr.find(e => e.name === ex.name);
            }
            
            return `
            <div class="gym-exercise-row" data-index="${i}">
              ${isEditMode ? `
                <div style="display: flex; flex-direction: column; gap: var(--space-sm); width: 100%;">
                  <div style="display: flex; justify-content: space-between;">
                    <input type="text" class="form-input edit-ex-name" value="${ex.name}" placeholder="Nume Exercițiu" style="flex: 1; margin-right: 8px; padding: 4px 8px;" />
                    <button class="btn btn-ghost btn-sm remove-ex-btn" data-session="${key}" data-index="${i}" style="color: var(--danger); padding: 4px;">❌</button>
                  </div>
                  <div style="display: flex; gap: var(--space-sm);">
                    <input type="text" class="form-input edit-ex-sets" value="${ex.sets}" placeholder="Serii x Rep" style="width: 100px; padding: 4px 8px;" />
                    <input type="text" class="form-input edit-ex-rest" value="${ex.rest}" placeholder="Pauză" style="width: 80px; padding: 4px 8px;" />
                    <input type="text" class="form-input edit-ex-notes" value="${ex.notes || ''}" placeholder="Note / Sfaturi" style="flex: 1; padding: 4px 8px;" />
                  </div>
                </div>
              ` : `
                <div class="gym-exercise-num">${i + 1}</div>
                <div class="gym-exercise-info" style="flex: 1;">
                  <div class="gym-exercise-name">${ex.name}</div>
                  <div class="gym-exercise-meta">
                    <span class="gym-sets">${ex.sets}</span>
                    <span class="gym-rest">⏱ ${ex.rest}</span>
                  </div>
                  ${ex.notes ? `<div class="gym-exercise-notes">${ex.notes}</div>` : ''}
                  
                  ${lastSession ? `
                    <div class="gym-last-session">
                      <span class="last-session-label">Ultima sesiune:</span>
                      ${lastSession.sets.map((s, si) => `
                        <span class="last-session-set">${s.weight}kg × ${s.reps}</span>
                      `).join('')}
                      ${lastSession.totalVolume ? `<span class="last-session-volume">Vol: ${lastSession.totalVolume}kg</span>` : ''}
                    </div>
                  ` : ''}
                  
                  ${loggedEx && loggedEx.sets ? `
                    <div class="gym-today-session">
                      ${loggedEx.sets.map((s, si) => {
                        const lastSet = lastSession?.sets?.[si];
                        const improved = lastSet && (s.weight > lastSet.weight || (s.weight === lastSet.weight && s.reps > lastSet.reps));
                        const declined = lastSet && (s.weight < lastSet.weight || (s.weight === lastSet.weight && s.reps < lastSet.reps));
                        const same = lastSet && !improved && !declined;
                        const cls = improved ? 'improved' : declined ? 'declined' : same ? 'same-perf' : '';
                        const emoji = improved ? ' 📈' : declined ? ' 📉' : same ? '' : '';
                        return `<span class="today-session-set ${cls}">${s.weight}kg × ${s.reps}${emoji}</span>`;
                      }).join('')}
                      ${(() => {
                        const todayVol = loggedEx.totalVolume;
                        const lastVol = lastSession?.totalVolume;
                        if (!todayVol) return '';
                        if (lastVol && todayVol > lastVol) return `<span class="today-session-volume improved">Vol: ${todayVol}kg 📈</span>`;
                        if (lastVol && todayVol < lastVol) return `<span class="today-session-volume declined">Vol: ${todayVol}kg 📉</span>`;
                        return `<span class="today-session-volume">Vol: ${todayVol}kg</span>`;
                      })()}
                    </div>
                  ` : ''}
                </div>
              `}
            </div>
          `;
          }).join('')}
        </div>
        ${isEditMode ? `
          <button class="btn btn-ghost btn-sm add-ex-btn" data-session="${key}" style="margin-top: var(--space-md); width: 100%; border-style: dashed;">
            ➕ Adaugă Exercițiu
          </button>
        ` : ''}
        </div>
      </div>
    `;
  }

  function renderConditioningCard(program, dateStr) {
    const rawLog = storage.getGymSession(dateStr, 'conditioning');
    const logged = rawLog && rawLog.exercises ? rawLog.exercises : rawLog;
    const isCollapsed = localStorage.getItem(`gym_collapsed_conditioning`) === 'true';
    return `
      <div class="card animate-in">
        <div class="card-header" style="align-items: flex-start;">
          <div style="flex: 1; margin-right: 12px; cursor: ${isEditMode ? 'default' : 'pointer'};" class="${isEditMode ? '' : 'gym-card-toggle'}" data-key="conditioning">
            ${isEditMode ? `
              <input type="text" class="form-input edit-prog-name" data-session="conditioning" value="${program.name}" style="font-size: 14px; font-weight: bold; width: 100%; margin-bottom: 4px; padding: 4px 8px; text-transform: uppercase;" />
              <div style="display: flex; gap: 4px; align-items: center;">
                <span style="font-size: 12px; color: var(--text-tertiary); white-space: nowrap;">${program.day} •</span>
                <input type="text" class="form-input edit-prog-focus" data-session="conditioning" value="${program.focus || ''}" style="font-size: 12px; width: 100%; padding: 2px 8px;" placeholder="Focus (ex: Cardio)" />
              </div>
            ` : `
              <div style="display: flex; align-items: center; gap: 8px;">
                <div class="card-title">${program.name}</div>
                <div class="toggle-icon" id="toggle-icon-conditioning" style="font-size: 12px; color: var(--text-tertiary);">${isCollapsed ? '▼' : '▲'}</div>
              </div>
              <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 2px">${program.day} • ${program.focus}</div>
            `}
          </div>
          ${!isEditMode ? `
            <button class="btn btn-sm ${logged ? 'btn-ghost' : 'btn-primary'} log-gym-btn" data-session="conditioning" data-date="${dateStr}">
              ${logged ? '✏️ Editează' : '📝 Loghează'}
            </button>
          ` : ''}
        </div>
        <div id="exercises-container-conditioning" style="display: ${isCollapsed && !isEditMode ? 'none' : 'block'};">
        <div class="conditioning-variants">
          ${logged && logged.stations && logged.stations.length > 0 ? `
            <div class="conditioning-variant">
              <div class="conditioning-variant-header">
                <span class="conditioning-variant-name">${logged.variant || 'Sesiune Logată'}</span>
                <span class="conditioning-variant-format">
                  ${logged.time ? logged.time + ' min' : ''}${logged.time && logged.rounds ? ', ' : ''}${logged.rounds ? logged.rounds + ' runde' : ''}
                </span>
              </div>
              <div class="conditioning-stations">
                ${logged.stations.map((s, si) => `
                  <div class="conditioning-station" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center;">
                      <span class="station-num">${si + 1}</span>
                      <span class="station-name">${s.name}</span>
                    </div>
                    ${s.value ? `<span style="font-size: 12px; font-weight: 600; color: var(--accent);">${s.value}</span>` : ''}
                  </div>
                `).join('')}
              </div>
            </div>
          ` : program.variants.map((v, vi) => `
            <div class="conditioning-variant" id="cond-variant-${vi}">
              <div class="conditioning-variant-header">
                ${isEditMode 
                  ? `<input type="text" class="form-input edit-cond-name" value="${v.name}" style="flex: 1; margin-right: 8px;" />
                     <input type="text" class="form-input edit-cond-format" value="${v.format}" style="flex: 1;" />`
                  : `<span class="conditioning-variant-name">${v.name}</span>
                     <span class="conditioning-variant-format">${v.format}</span>`
                }
              </div>
              <div class="conditioning-stations">
                ${v.stations.map((s, si) => `
                  <div class="conditioning-station" style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center;">
                      <span class="station-num">${si + 1}</span>
                      ${isEditMode
                        ? `<input type="text" class="form-input edit-cond-station" value="${s}" style="flex: 1; padding: 4px;" />
                           <button class="btn btn-ghost btn-sm remove-cond-station-btn" data-variant="${vi}" data-station="${si}" style="color: var(--danger); margin-left: 8px;">❌</button>`
                        : `<span class="station-name">${s}</span>`
                      }
                    </div>
                  </div>
                `).join('')}
              </div>
              ${isEditMode ? `
                <button class="btn btn-ghost btn-sm add-cond-station-btn" data-variant="${vi}" style="margin-top: var(--space-sm); width: 100%; border-style: dashed;">
                  ➕ Adaugă Stație
                </button>
              ` : ''}
            </div>
          `).join('')}
        </div>
        </div>
      </div>
    `;
  }

  function attachEvents() {
    // Edit mode toggle
    const toggleBtn = page.querySelector('#toggle-edit-mode');
    toggleBtn?.addEventListener('click', () => {
      if (isEditMode) {
        saveEdits();
        storage.saveCustomGymPrograms(currentPrograms);
      }
      isEditMode = !isEditMode;
      render();
    });

    // Collapsible cards toggle
    if (!isEditMode) {
      page.querySelectorAll('.gym-card-toggle').forEach(el => {
        el.addEventListener('click', () => {
          const key = el.dataset.key;
          // Use document.getElementById or relative query so it works even if detached from page
          const container = document.getElementById(`exercises-container-${key}`);
          const icon = document.getElementById(`toggle-icon-${key}`);
          if (container && icon) {
            const isCollapsed = container.style.display === 'none';
            if (isCollapsed) {
              container.style.display = 'block';
              icon.textContent = '▲';
              localStorage.setItem(`gym_collapsed_${key}`, 'false');
            } else {
              container.style.display = 'none';
              icon.textContent = '▼';
              localStorage.setItem(`gym_collapsed_${key}`, 'true');
            }
          }
        });
      });
    }

    // Logging workouts — opens the detailed logging modal
    if (!isEditMode) {
      page.querySelectorAll('.log-gym-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sessionType = btn.dataset.session;
          const sessionDateStr = btn.dataset.date;
          
          if (sessionType === 'conditioning') {
            openConditioningLogModal(sessionDateStr);
          } else {
            const exercises = currentPrograms[sessionType]?.exercises || [];
            openGymLogModal(sessionType, exercises, sessionDateStr);
          }
        });
      });
    }

    // Add exercise in edit mode
    if (isEditMode) {
      page.querySelectorAll('.add-ex-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const session = btn.dataset.session;
          saveEdits();
          currentPrograms[session].exercises.push({
            name: 'Exercițiu Nou',
            sets: '3 × 10',
            rest: '60s',
            notes: ''
          });
          render();
        });
      });

      // Remove exercise
      page.querySelectorAll('.remove-ex-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const session = btn.dataset.session;
          const index = parseInt(btn.dataset.index);
          saveEdits();
          currentPrograms[session].exercises.splice(index, 1);
          render();
        });
      });

      // Add conditioning station
      page.querySelectorAll('.add-cond-station-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const vIndex = parseInt(btn.dataset.variant);
          saveEdits();
          currentPrograms.conditioning.variants[vIndex].stations.push('Stație Nouă');
          render();
        });
      });

      // Remove conditioning station
      page.querySelectorAll('.remove-cond-station-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const vIndex = parseInt(btn.dataset.variant);
          const sIndex = parseInt(btn.dataset.station);
          saveEdits();
          currentPrograms.conditioning.variants[vIndex].stations.splice(sIndex, 1);
          render();
        });
      });
    }
  }

  function saveEdits() {
    // Save standard sessions
    ['lower', 'upper1', 'upper2', 'accesorii'].forEach(sessionKey => {
      // Save header data
      const progNameInput = page.querySelector(`.edit-prog-name[data-session="${sessionKey}"]`);
      const progFocusInput = page.querySelector(`.edit-prog-focus[data-session="${sessionKey}"]`);
      const progNotesInput = page.querySelector(`.edit-prog-notes[data-session="${sessionKey}"]`);
      
      if (progNameInput && currentPrograms[sessionKey]) currentPrograms[sessionKey].name = progNameInput.value;
      if (progFocusInput && currentPrograms[sessionKey]) currentPrograms[sessionKey].focus = progFocusInput.value;
      if (progNotesInput && currentPrograms[sessionKey]) currentPrograms[sessionKey].notes = progNotesInput.value;

      // Save exercises
      const rows = page.querySelectorAll(`#exercises-${sessionKey} .gym-exercise-row`);
      rows.forEach((row, i) => {
        const name = row.querySelector('.edit-ex-name')?.value;
        const sets = row.querySelector('.edit-ex-sets')?.value;
        const rest = row.querySelector('.edit-ex-rest')?.value;
        const notes = row.querySelector('.edit-ex-notes')?.value;
        if (name && currentPrograms[sessionKey].exercises[i]) {
          currentPrograms[sessionKey].exercises[i].name = name;
          currentPrograms[sessionKey].exercises[i].sets = sets;
          currentPrograms[sessionKey].exercises[i].rest = rest;
          currentPrograms[sessionKey].exercises[i].notes = notes;
        }
      });
    });

    // Save conditioning
    if (currentPrograms.conditioning) {
      // Save header data
      const condNameInput = page.querySelector(`.edit-prog-name[data-session="conditioning"]`);
      const condFocusInput = page.querySelector(`.edit-prog-focus[data-session="conditioning"]`);
      if (condNameInput) currentPrograms.conditioning.name = condNameInput.value;
      if (condFocusInput) currentPrograms.conditioning.focus = condFocusInput.value;

      currentPrograms.conditioning.variants.forEach((v, vi) => {
        const variantDiv = page.querySelector(`#cond-variant-${vi}`);
        if (variantDiv) {
          const name = variantDiv.querySelector('.edit-cond-name')?.value;
          const format = variantDiv.querySelector('.edit-cond-format')?.value;
          if (name) v.name = name;
          if (format) v.format = format;
          
          const stationInputs = variantDiv.querySelectorAll('.edit-cond-station');
          stationInputs.forEach((input, si) => {
            if (v.stations[si] !== undefined) {
              v.stations[si] = input.value;
            }
          });
        }
      });
    }
  }

  // Gym Log Modal — per exercise, per set, weight + reps + INLINE EDIT
  function openGymLogModal(sessionType, exercises, dateStr) {
    // Work on a mutable copy of exercises so we can add/remove/reorder
    let workingExercises = exercises.map(ex => ({ ...ex }));
    
    function buildModal() {
      const currentLog = storage.getGymSession(dateStr, sessionType);
      const currentLogExercises = currentLog && Array.isArray(currentLog.exercises) ? currentLog.exercises 
                                : (currentLog && currentLog.exercises && Array.isArray(currentLog.exercises.exercises) ? currentLog.exercises.exercises : []);

      const exercisesWithSets = workingExercises.map((ex, ei) => {
        const setsMatch = (ex.sets || '3').match(/(\d+)\s*[×x]/i);
        const numSets = setsMatch ? parseInt(setsMatch[1]) : 3;
        
        const loggedEx = currentLogExercises.find(e => e.name === ex.name);
        const lastData = getLastSessionData(sessionType, ex.name, ei, dateStr);
        
        const sets = [];
        const targetSetsCount = ex._tempSets ? ex._tempSets.length : (loggedEx && loggedEx.sets ? Math.max(numSets, loggedEx.sets.length) : numSets);
        
        for (let i = 0; i < targetSetsCount; i++) {
          let w = '', r = '';
          if (ex._tempSets && ex._tempSets[i]) {
            w = ex._tempSets[i].weight;
            r = ex._tempSets[i].reps;
          } else if (loggedEx && loggedEx.sets && loggedEx.sets[i]) {
            w = loggedEx.sets[i].weight;
            r = loggedEx.sets[i].reps;
          } else if (!currentLog) {
            w = lastData?.sets?.[i]?.weight || '';
            r = lastData?.sets?.[i]?.reps || '';
          }
          sets.push({ weight: w, reps: r });
        }
        return { name: ex.name, sets, numSets };
      });

      return `
        <div class="modal" style="max-width: 620px; max-height: 85vh; overflow-y: auto;">
          <div class="modal-title">📝 Loghează: ${currentPrograms[sessionType]?.name || 'Sesiune'}</div>
          <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: var(--space-lg);">
            Introdu greutatea și repetările. Poți și <b>șterge</b>, <b>reordona</b> sau <b>adăuga</b> exerciții.
          </div>
          
          <div id="gym-log-exercises">
            ${exercisesWithSets.map((ex, ei) => {
              const hasLastData = ex.sets.some(s => s.weight || s.reps);
              const lastDataStr = hasLastData ? ex.sets.map(s => s.weight && s.reps ? `<b>${s.weight}</b>kg × <b>${s.reps}</b>` : '-').join(' | ') : '';
              const isFirst = ei === 0;
              const isLast = ei === exercisesWithSets.length - 1;
              return `
              <div class="gym-log-exercise" data-index="${ei}" draggable="true" style="position: relative; padding: 12px; margin-bottom: 12px; background: rgba(255,255,255,0.02); border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06); cursor: grab;">
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: ${hasLastData ? '4px' : 'var(--space-md)'};">
                  <div style="display: flex; flex-direction: column; gap: 2px; cursor: grab;" class="drag-handle" title="Trage pentru a reordona">
                    <span style="font-size: 16px; opacity: 0.5;">↕️</span>
                  </div>
                  <input type="text" class="form-input gym-log-ex-name" data-idx="${ei}" value="${ex.name}" style="flex: 1; font-weight: 700; color: var(--accent); background: transparent; border: 1px solid transparent; padding: 4px 8px; font-size: 14px; transition: border-color 0.2s;" onfocus="this.style.borderColor='var(--accent)'" onblur="this.style.borderColor='transparent'" />
                  <button class="gym-log-delete-ex-btn" data-idx="${ei}" style="background: none; border: none; cursor: pointer; font-size: 16px; padding: 4px; opacity: 0.6; transition: opacity 0.2s;" title="Șterge exercițiul" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.6'">🗑️</button>
                </div>
                ${hasLastData ? `<div style="font-size: 12px; color: var(--text-secondary); margin-bottom: var(--space-md); padding: 6px 10px; background: rgba(59, 130, 246, 0.1); border-left: 2px solid var(--info); border-radius: 4px;">📈 Țintă (tura trecută): <span style="color: var(--text-primary);">${lastDataStr}</span></div>` : ''}
                <div class="gym-log-sets">
                  <div class="gym-log-sets-header">
                    <span style="width: 30px; text-align: center; font-size: 11px; color: var(--text-tertiary);">Set</span>
                    <span style="flex: 1; text-align: center; font-size: 11px; color: var(--text-tertiary);">Greutate (kg)</span>
                    <span style="flex: 1; text-align: center; font-size: 11px; color: var(--text-tertiary);">Repetări</span>
                    <span style="width: 24px;"></span>
                  </div>
                  ${ex.sets.map((s, si) => `
                    <div class="gym-log-set-row">
                      <span class="gym-log-set-num" style="width: 30px;">${si + 1}</span>
                      <input type="number" class="form-input gym-log-weight" data-ex="${ei}" data-set="${si}" value="${s.weight}" placeholder="kg" step="0.5" style="flex: 1; text-align: center; padding: 6px;" />
                      <input type="number" class="form-input gym-log-reps" data-ex="${ei}" data-set="${si}" value="${s.reps}" placeholder="reps" style="flex: 1; text-align: center; padding: 6px;" />
                      <button class="btn btn-ghost btn-sm remove-set-btn" data-ex="${ei}" data-set="${si}" style="color: var(--danger); width: 24px; padding: 0;">❌</button>
                    </div>
                  `).join('')}
                  <button class="btn btn-ghost btn-sm gym-add-set-btn" data-ex="${ei}" style="width: 100%; margin-top: 4px; font-size: 11px; border-style: dashed;">+ Set</button>
                </div>
              </div>
              `;
            }).join('')}
          </div>

          <button type="button" class="btn btn-ghost" id="gym-log-add-exercise" style="width: 100%; border-style: dashed; margin-bottom: var(--space-lg); color: var(--success); border-color: rgba(46,213,115,0.3);">
            ➕ Adaugă Exercițiu Nou
          </button>

          <div style="display: flex; gap: 12px; justify-content: flex-end; padding-top: var(--space-md); border-top: 1px solid var(--border-subtle); flex-wrap: wrap;">
            <button type="button" class="btn btn-ghost" id="gym-log-cancel">Anulează</button>
            <button type="button" class="btn btn-primary" id="gym-log-save">💾 Salvează Sesiunea</button>
          </div>
        </div>
      `;
    }

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'gym-log-modal';
    modal.innerHTML = buildModal();
    document.body.appendChild(modal);

    function attachModalEvents() {
      // Close handlers
      modal.querySelector('#gym-log-cancel').addEventListener('click', () => modal.remove());

      // Add Exercise
      modal.querySelector('#gym-log-add-exercise')?.addEventListener('click', () => {
        // Save current name and set edits before rebuilding
        syncEdits();
        workingExercises.push({ name: 'Exercițiu Nou', sets: '3 × 10', rest: '60s', notes: '' });
        rebuildModal();
      });

      // Event delegation for all dynamic buttons
      modal.addEventListener('click', (e) => {
        const target = e.target;

        // Delete exercise
        if (target.classList.contains('gym-log-delete-ex-btn') || target.closest('.gym-log-delete-ex-btn')) {
          const btn = target.classList.contains('gym-log-delete-ex-btn') ? target : target.closest('.gym-log-delete-ex-btn');
          const idx = parseInt(btn.dataset.idx);
          if (workingExercises.length <= 1) {
            if (window.showToast) window.showToast('⚠️ Nu poți șterge ultimul exercițiu!');
            return;
          }
          syncEdits();
          workingExercises.splice(idx, 1);
          rebuildModal();
        }

        // Remove set
        if (target.classList.contains('remove-set-btn')) {
          const row = target.closest('.gym-log-set-row');
          const container = row.closest('.gym-log-sets');
          row.remove();
          container.querySelectorAll('.gym-log-set-row').forEach((r, i) => {
            r.querySelector('.gym-log-set-num').textContent = i + 1;
            r.querySelector('.gym-log-weight').dataset.set = i;
            r.querySelector('.gym-log-reps').dataset.set = i;
          });
        }
      });

      // Drag and Drop reordering logic
      let draggedIdx = null;
      
      modal.addEventListener('dragstart', (e) => {
        const exCard = e.target.closest('.gym-log-exercise');
        if (exCard) {
          draggedIdx = parseInt(exCard.dataset.index);
          e.dataTransfer.effectAllowed = 'move';
          setTimeout(() => exCard.style.opacity = '0.4', 0);
        }
      });

      modal.addEventListener('dragend', (e) => {
        const exCard = e.target.closest('.gym-log-exercise');
        if (exCard) {
          exCard.style.opacity = '1';
          draggedIdx = null;
          
          modal.querySelectorAll('.gym-log-exercise').forEach(el => {
            el.style.borderTop = '1px solid rgba(255,255,255,0.06)';
            el.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
          });
        }
      });

      modal.addEventListener('dragover', (e) => {
        e.preventDefault();
        
        // Auto-scroll when dragging near top/bottom
        const scrollContainer = modal.querySelector('.modal');
        if (scrollContainer) {
          const rect = scrollContainer.getBoundingClientRect();
          const threshold = 60;
          if (e.clientY < rect.top + threshold) scrollContainer.scrollTop -= 15;
          else if (e.clientY > rect.bottom - threshold) scrollContainer.scrollTop += 15;
        }

        const exCard = e.target.closest('.gym-log-exercise');
        if (exCard && draggedIdx !== null) {
          const bounding = exCard.getBoundingClientRect();
          const offset = bounding.y + (bounding.height / 2);
          if (e.clientY - offset > 0) {
            exCard.style.borderBottom = '2px solid var(--accent)';
            exCard.style.borderTop = '1px solid rgba(255,255,255,0.06)';
          } else {
            exCard.style.borderTop = '2px solid var(--accent)';
            exCard.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
          }
        }
      });

      modal.addEventListener('dragleave', (e) => {
        const exCard = e.target.closest('.gym-log-exercise');
        if (exCard) {
          exCard.style.borderTop = '1px solid rgba(255,255,255,0.06)';
          exCard.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        }
      });

      modal.addEventListener('drop', (e) => {
        e.preventDefault();
        const exCard = e.target.closest('.gym-log-exercise');
        if (exCard && draggedIdx !== null) {
          const targetIdx = parseInt(exCard.dataset.index);
          if (targetIdx !== draggedIdx) {
            syncEdits();
            const bounding = exCard.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            let finalIdx = targetIdx;
            
            // If dropping on the bottom half, insert after
            if (e.clientY - offset > 0) {
               finalIdx = targetIdx > draggedIdx ? targetIdx : targetIdx + 1;
            } else {
               // dropping on top half, insert before
               finalIdx = targetIdx > draggedIdx ? targetIdx - 1 : targetIdx;
            }
            
            const movedItem = workingExercises.splice(draggedIdx, 1)[0];
            workingExercises.splice(finalIdx, 0, movedItem);
            rebuildModal();
          }
        }
        
        modal.querySelectorAll('.gym-log-exercise').forEach(el => {
          el.style.borderTop = '1px solid rgba(255,255,255,0.06)';
          el.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
        });
      });



      // Add Set buttons
      modal.querySelectorAll('.gym-add-set-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const exIdx = parseInt(btn.dataset.ex);
          const setsContainer = btn.closest('.gym-log-sets');
          const existingSets = setsContainer.querySelectorAll('.gym-log-set-row').length;
          const newRow = document.createElement('div');
          newRow.className = 'gym-log-set-row';
          newRow.innerHTML = `
            <span class="gym-log-set-num" style="width: 30px;">${existingSets + 1}</span>
            <input type="number" class="form-input gym-log-weight" data-ex="${exIdx}" data-set="${existingSets}" value="" placeholder="kg" step="0.5" style="flex: 1; text-align: center; padding: 6px;" />
            <input type="number" class="form-input gym-log-reps" data-ex="${exIdx}" data-set="${existingSets}" value="" placeholder="reps" style="flex: 1; text-align: center; padding: 6px;" />
            <button class="btn btn-ghost btn-sm remove-set-btn" style="color: var(--danger); width: 24px; padding: 0;">❌</button>
          `;
          btn.before(newRow);
        });
      });

      // Save handler
      modal.querySelector('#gym-log-save').addEventListener('click', () => {
        syncEdits();
        
        // Save updated program structure
        if (currentPrograms[sessionType]) {
          currentPrograms[sessionType].exercises = workingExercises.map(ex => ({
            name: ex.name,
            sets: ex.sets || '3 × 10',
            rest: ex.rest || '60s',
            notes: ex.notes || ''
          }));
          storage.saveCustomGymPrograms(currentPrograms);
        }

        // Collect logged data
        const exBlocks = modal.querySelectorAll('.gym-log-exercise');
        const logExercises = [];
        exBlocks.forEach((block) => {
          const nameInput = block.querySelector('.gym-log-ex-name');
          const name = nameInput ? nameInput.value : 'Unknown';
          const weightInputs = block.querySelectorAll('.gym-log-weight');
          const sets = [];
          let totalVolume = 0;
          
          weightInputs.forEach((weightInput) => {
            const setIdx = weightInput.dataset.set;
            const repsInput = block.querySelector(`.gym-log-reps[data-set="${setIdx}"]`);
            const weight = parseFloat(weightInput.value) || 0;
            const reps = parseInt(repsInput?.value) || 0;
            if (weight > 0 || reps > 0) {
              sets.push({ weight, reps });
              totalVolume += weight * reps;
            }
          });

          logExercises.push({
            name,
            sets,
            totalVolume,
            plannedSets: workingExercises.find(e => e.name === name)?.sets || '',
            completed: sets.length > 0
          });
        });

        storage.saveGymSession(dateStr, sessionType, logExercises);
        
        storage.saveWorkout(dateStr, {
          type: sessionType === 'conditioning' ? 'conditioning' : 'gym',
          distance: 0,
          duration: 0,
          hr: 0,
          rpe: 0,
          notes: `${currentPrograms[sessionType]?.name || 'Conditioning'} — ${logExercises.filter(e => e.completed).length} exerciții completate`,
          source: 'manual'
        });

        modal.remove();
        if (window.showToast) window.showToast('🏋️ Sesiune de sală salvată!');
        render();
        import('./router.js').then(({ renderCurrentRoute }) => renderCurrentRoute());
      });
    }

    function syncEdits() {
      // sync names
      modal.querySelectorAll('.gym-log-ex-name').forEach(input => {
        const idx = parseInt(input.dataset.idx);
        if (workingExercises[idx]) {
          workingExercises[idx].name = input.value;
        }
      });
      // sync sets (weights & reps)
      modal.querySelectorAll('.gym-log-exercise').forEach(exCard => {
        const idx = parseInt(exCard.dataset.index);
        if (workingExercises[idx]) {
          workingExercises[idx]._tempSets = [];
          exCard.querySelectorAll('.gym-log-set-row').forEach(row => {
            const w = row.querySelector('.gym-log-weight').value;
            const r = row.querySelector('.gym-log-reps').value;
            workingExercises[idx]._tempSets.push({ weight: w, reps: r });
          });
        }
      });
    }

    function rebuildModal() {
      const scrollTop = modal.querySelector('.modal')?.scrollTop || 0;
      modal.innerHTML = buildModal();
      attachModalEvents();
      const modalDiv = modal.querySelector('.modal');
      if (modalDiv) modalDiv.scrollTop = scrollTop;
    }

    // Overlay click to close
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    attachModalEvents();
  }

  // ── Conditioning Log Modal — station-appropriate metrics ──────────────────
  // ── Conditioning Log Modal — station-appropriate metrics ──────────────────
  function openConditioningLogModal(dateStr) {
    const program = currentPrograms.conditioning;
    const variant = program.variants[0];
    const rawLog = storage.getGymSession(dateStr, 'conditioning');
    const existingLog = rawLog && rawLog.exercises ? rawLog.exercises : rawLog;
    
    let stations = existingLog && existingLog.stations && existingLog.stations.length > 0
                   ? existingLog.stations.map(s => s.name)
                   : [...variant.stations];

    function getStationMetricOption(station) {
      const s = station.toLowerCase();
      if (s.includes('row') || s.includes('sled') || s.includes('farmer') || s.includes('walk') || s.includes('push') || s.includes('run')) return 'm';
      if (s.includes('ski') || s.includes('bike') || s.includes('assault') || s.includes('echo')) return 'cal';
      if (s.includes('plank') || s.includes('hold')) return 'sec';
      return 'reps';
    }

    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'conditioning-log-modal';
    
    function renderStations() {
      return stations.map((s, i) => {
        let defaultMetric = getStationMetricOption(s);
        let defaultVal = '';
        if (existingLog && existingLog.stations && existingLog.stations[i]) {
          const loggedVal = existingLog.stations[i].value; // e.g., "500 m" or "15 reps"
          if (loggedVal) {
            const parts = loggedVal.trim().split(' ');
            if (parts.length > 1) {
              defaultMetric = parts[parts.length - 1];
              defaultVal = parts.slice(0, -1).join(' ');
            } else {
              defaultVal = parts[0];
            }
          }
        }

        return `
          <div class="cond-log-station-row" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;">
            <span class="cond-log-station-num" style="width: 24px; height: 24px; border-radius: 50%; background: var(--conditioning-bg); color: var(--conditioning); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">${i + 1}</span>
            <input type="text" class="form-input cond-station-name" value="${s}" placeholder="Nume Exercițiu" style="flex: 2; padding: 6px 8px; font-size: 13px;" />
            <input type="number" class="form-input cond-station-value" value="${defaultVal}" placeholder="valoare" style="flex: 1; min-width: 60px; padding: 6px 8px; font-size: 13px; text-align: center;" />
            <select class="form-input cond-station-metric" style="width: 75px; padding: 6px 4px; font-size: 12px;">
              <option value="reps" ${defaultMetric === 'reps' ? 'selected' : ''}>reps</option>
              <option value="m" ${defaultMetric === 'm' ? 'selected' : ''}>metri</option>
              <option value="kg" ${defaultMetric === 'kg' ? 'selected' : ''}>kg</option>
              <option value="cal" ${defaultMetric === 'cal' ? 'selected' : ''}>cal</option>
              <option value="min" ${defaultMetric === 'min' ? 'selected' : ''}>min</option>
              <option value="sec" ${defaultMetric === 'sec' ? 'selected' : ''}>sec</option>
            </select>
            <button type="button" class="btn btn-ghost btn-sm remove-cond-log-btn" data-index="${i}" style="color: var(--danger); padding: 4px;">❌</button>
          </div>
        `;
      }).join('');
    }

    modal.innerHTML = `
      <div class="modal" style="max-width: 600px; max-height: 85vh; overflow-y: auto;">
        <div class="modal-title">📝 Loghează: ${program.name}</div>
        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: var(--space-md);">
          ${variant.name} • ${variant.format}
        </div>
        
        <div style="display: flex; gap: 12px; margin-bottom: var(--space-lg);">
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Runde (opțional)</label>
            <input type="number" class="form-input" id="cond-rounds" value="${existingLog ? (existingLog.rounds || '') : ''}" placeholder="ex: 3" min="1" />
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">Timp total (min)</label>
            <input type="number" class="form-input" id="cond-time" value="${existingLog ? (existingLog.time || '') : ''}" placeholder="ex: 45" />
          </div>
          <div class="form-group" style="flex: 1;">
            <label class="form-label">RPE (1-10)</label>
            <input type="number" class="form-input" id="cond-rpe" value="${existingLog ? (existingLog.rpe || '') : ''}" min="1" max="10" placeholder="8" />
          </div>
        </div>
        
        <div style="font-size: 13px; font-weight: 600; margin-bottom: var(--space-sm); color: var(--text-secondary);">Stații Efectuate:</div>
        <div id="cond-stations-log-container">
          ${renderStations()}
        </div>
        
        <button type="button" class="btn btn-ghost btn-sm" id="add-cond-log-btn" style="width: 100%; border-style: dashed; margin-top: 8px;">
          ➕ Adaugă Stație / Exercițiu
        </button>

        <div class="form-group" style="margin-top: var(--space-lg);">
          <label class="form-label">Notițe</label>
          <textarea class="form-input" id="cond-notes" rows="2" placeholder="Cum a fost? Ce modificări ai făcut?">${existingLog ? (existingLog.notes || '') : ''}</textarea>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-ghost" id="cond-log-cancel">Anulează</button>
          <button type="button" class="btn btn-primary" id="cond-log-save">💾 Salvează Sesiunea</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    
    const container = modal.querySelector('#cond-stations-log-container');

    // Handle removing stations (event delegation)
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('.remove-cond-log-btn');
      if (btn) {
        btn.closest('.cond-log-station-row').remove();
        // Update numbers
        container.querySelectorAll('.cond-log-station-num').forEach((el, idx) => {
          el.textContent = idx + 1;
        });
      }
    });

    // Handle adding stations
    modal.querySelector('#add-cond-log-btn').addEventListener('click', () => {
      const currentCount = container.querySelectorAll('.cond-log-station-row').length;
      const newRow = document.createElement('div');
      newRow.innerHTML = `
        <div class="cond-log-station-row" style="display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.02); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid rgba(255,255,255,0.05); margin-bottom: 8px;">
          <span class="cond-log-station-num" style="width: 24px; height: 24px; border-radius: 50%; background: var(--conditioning-bg); color: var(--conditioning); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">${currentCount + 1}</span>
          <input type="text" class="form-input cond-station-name" value="" placeholder="Nume Exercițiu" style="flex: 2; padding: 6px 8px; font-size: 13px;" />
          <input type="number" class="form-input cond-station-value" placeholder="valoare" style="flex: 1; min-width: 60px; padding: 6px 8px; font-size: 13px; text-align: center;" />
          <select class="form-input cond-station-metric" style="width: 75px; padding: 6px 4px; font-size: 12px;">
            <option value="reps" selected>reps</option>
            <option value="m">metri</option>
            <option value="kg">kg</option>
            <option value="cal">cal</option>
            <option value="min">min</option>
            <option value="sec">sec</option>
          </select>
          <button type="button" class="btn btn-ghost btn-sm remove-cond-log-btn" style="color: var(--danger); padding: 4px;">❌</button>
        </div>
      `;
      container.appendChild(newRow.firstElementChild);
    });

    modal.querySelector('#cond-log-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelector('#cond-log-save').addEventListener('click', () => {
      const rounds = parseInt(modal.querySelector('#cond-rounds').value) || 0;
      const time = parseInt(modal.querySelector('#cond-time').value) || 0;
      const rpe = parseInt(modal.querySelector('#cond-rpe').value) || 0;
      const notes = modal.querySelector('#cond-notes').value;

      const stationNames = modal.querySelectorAll('.cond-station-name');
      const stationValues = modal.querySelectorAll('.cond-station-value');
      const stationMetrics = modal.querySelectorAll('.cond-station-metric');
      
      const logStations = [];
      stationNames.forEach((nameInput, i) => {
        const val = stationValues[i]?.value || '';
        const metric = stationMetrics[i]?.value || 'reps';
        if (nameInput.value.trim() !== '') {
          logStations.push({
            name: nameInput.value,
            value: val ? `${val} ${metric}` : '',
            completed: val !== ''
          });
        }
      });

      storage.saveGymSession(dateStr, 'conditioning', {
        type: 'conditioning',
        variant: variant.name,
        rounds, time, rpe, notes,
        stations: logStations
      });

      storage.saveWorkout(dateStr, {
        type: 'conditioning',
        distance: 0,
        duration: time,
        hr: 0,
        rpe,
        notes: `${program.name} — ${rounds ? rounds + ' runde, ' : ''}${time} min${notes ? '. ' + notes : ''}`,
        source: 'manual'
      });

      modal.remove();
      if (window.showToast) window.showToast('💪 Conditioning logat!');
      render();
      import('./router.js').then(({ renderCurrentRoute }) => renderCurrentRoute());
    });
  }

  render();
  return page;
}

export function getDashboardGymCardNode(title, dateStr) {
  const page = renderGymPage(dateStr);
  const cards = Array.from(page.querySelectorAll('.card'));
  
  // Find the exact card that matches the title
  let targetCard = cards.find(c => {
    const cardTitle = c.querySelector('.card-title');
    return cardTitle && cardTitle.textContent.toLowerCase().includes(title.toLowerCase());
  });
  
  // Fallback for conditioning which might just be named "Conditioning"
  if (!targetCard && title.toLowerCase().includes('conditioning')) {
     targetCard = cards.find(c => c.querySelector('.card-title').textContent.toLowerCase().includes('conditioning'));
  }
  
  return targetCard;
}
