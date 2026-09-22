// ============================================
// Gym Page — Exercise Programs (Editable + Progressive Overload)
// ============================================

import { GYM_PROGRAMS, PLAN_START, getCurrentWeek, getDynamicWeekSchedule } from './data.js';
import { storage } from './storage.js';

let isEditMode = false;
let currentPrograms = null;

export function renderGymPage() {
  const page = document.createElement('div');
  page.className = 'gym-page animate-in';
  
  // Load programs from storage or fallback to defaults
  currentPrograms = storage.getCustomGymPrograms(GYM_PROGRAMS);
  const todayStr = new Date().toISOString().split('T')[0];

  // Dynamically find scheduled dates for gym sessions
  const weekNum = getCurrentWeek();
  const weekScheduleKey = `week_schedule_${weekNum}`;
  const currentSchedule = storage.get(weekScheduleKey) || getDynamicWeekSchedule(weekNum);
  
  const weekStartDate = new Date(PLAN_START);
  weekStartDate.setDate(PLAN_START.getDate() + (weekNum - 1) * 7);

  const scheduledDates = { lower: todayStr, upper1: todayStr, upper2: todayStr, conditioning: todayStr, accesorii: todayStr };
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
        <div class="gym-intro animate-in" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--space-lg);">
          <p style="color: var(--text-secondary); font-size: 14px; line-height: 1.7; flex: 1;">
            <strong style="color: var(--text-primary)">Program Dinamic:</strong> Zilele sunt preluate direct din <a href="#/" style="color: var(--accent)">Dashboard</a>.
            <br>
            <span style="color: var(--warning)">⚠️ Niciodată la eșec pe picioare (RIR 3-4). Femuralul drept — greutate ușoară pe curls.</span>
          </p>
          <button class="btn btn-ghost" id="toggle-edit-mode" style="margin-left: var(--space-md);">
            ${isEditMode ? '💾 Salvează Programul' : '✏️ Editează Programul'}
          </button>
        </div>

        <!-- Gym Program Cards -->
        <div class="grid-2" style="margin-bottom: var(--space-lg)">
          ${renderGymCard(currentPrograms.lower, 'lower', scheduledDates.lower)}
          ${renderConditioningCard(currentPrograms.conditioning, scheduledDates.conditioning)}
        </div>
        <div class="grid-2" style="margin-bottom: var(--space-lg)">
          ${renderGymCard(currentPrograms.upper1, 'upper1', scheduledDates.upper1)}
          ${renderGymCard(currentPrograms.upper2, 'upper2', scheduledDates.upper2)}
        </div>
        <div class="grid-2">
          ${renderGymCard(currentPrograms.accesorii, 'accesorii', scheduledDates.accesorii)}
        </div>
      </div>
    `;
    attachEvents();
  }

  function getLastSessionData(sessionKey, exerciseName, currentDateStr) {
    const gymLogs = storage.get('gym', {});
    const dates = Object.keys(gymLogs).sort().reverse();
    
    for (const date of dates) {
      if (date === currentDateStr) continue; // Skip current planned date
      const session = gymLogs[date]?.[sessionKey];
      if (session) {
        // Handle potentially corrupted data (nested exercises object)
        const exercisesArr = Array.isArray(session.exercises) 
          ? session.exercises 
          : (session.exercises && Array.isArray(session.exercises.exercises) ? session.exercises.exercises : null);
          
        if (exercisesArr) {
          const ex = exercisesArr.find(e => e.name === exerciseName);
          if (ex && ex.sets && ex.sets.length > 0) {
            return ex;
          }
        }
      }
    }
    return null;
  }

  function renderGymCard(program, key, dateStr) {
    const logged = storage.getGymSession(dateStr, key);
    return `
      <div class="card animate-in">
        <div class="card-header">
          <div>
            <div class="card-title">${program.name}</div>
            <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 2px">${program.day} • ${program.focus}</div>
          </div>
          ${!isEditMode ? `
            <button class="btn btn-sm ${logged ? 'btn-ghost' : 'btn-primary'} log-gym-btn" data-session="${key}" data-date="${dateStr}" ${logged ? 'disabled' : ''}>
              ${logged ? '✓ Logat' : '📝 Loghează Sesiune'}
            </button>
          ` : ''}
        </div>
        ${program.notes ? `<div style="font-size: 12px; color: var(--warning); margin-bottom: var(--space-md); padding: 8px 12px; background: rgba(234,179,8,0.08); border-radius: var(--radius-md);">${program.notes}</div>` : ''}
        
        <div class="gym-exercises" id="exercises-${key}">
          ${program.exercises.map((ex, i) => {
            const lastSession = getLastSessionData(key, ex.name, dateStr);
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
                        return `<span class="today-session-set ${improved ? 'improved' : ''}">${s.weight}kg × ${s.reps}${improved ? ' 📈' : ''}</span>`;
                      }).join('')}
                      ${loggedEx.totalVolume ? `<span class="today-session-volume">Vol: ${loggedEx.totalVolume}kg</span>` : ''}
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
    `;
  }

  function renderConditioningCard(program, dateStr) {
    const logged = storage.getGymSession(dateStr, 'conditioning');
    return `
      <div class="card animate-in">
        <div class="card-header">
          <div>
            <div class="card-title">${program.name}</div>
            <div style="font-size: 12px; color: var(--text-tertiary); margin-top: 2px">${program.day} • ${program.focus}</div>
          </div>
          ${!isEditMode ? `
            <button class="btn btn-sm ${logged ? 'btn-ghost' : 'btn-primary'} log-gym-btn" data-session="conditioning" data-date="${dateStr}" ${logged ? 'disabled' : ''}>
              ${logged ? '✓ Logat' : '📝 Loghează'}
            </button>
          ` : ''}
        </div>
        <div class="conditioning-variants">
          ${program.variants.map((v, vi) => `
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
                  <div class="conditioning-station">
                    <span class="station-num">${si + 1}</span>
                    ${isEditMode
                      ? `<input type="text" class="form-input edit-cond-station" value="${s}" style="flex: 1; padding: 4px;" />
                         <button class="btn btn-ghost btn-sm remove-cond-station-btn" data-variant="${vi}" data-station="${si}" style="color: var(--danger); margin-left: 8px;">❌</button>`
                      : `<span class="station-name">${s}</span>`
                    }
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

    // Logging workouts — opens the detailed logging modal
    if (!isEditMode) {
      page.querySelectorAll('.log-gym-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const sessionType = btn.dataset.session;
          const sessionDateStr = btn.dataset.date;
          const exercises = sessionType === 'conditioning' 
            ? currentPrograms.conditioning.variants[0].stations.map((s, i) => ({ name: s, sets: '1' }))
            : currentPrograms[sessionType]?.exercises || [];
          
          openGymLogModal(sessionType, exercises, sessionDateStr);
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
    ['lower', 'upper1', 'upper2'].forEach(sessionKey => {
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

  // Gym Log Modal — per exercise, per set, weight + reps
  function openGymLogModal(sessionType, exercises, dateStr) {
    // Parse number of sets from the exercise definition (e.g., "3 × 10" → 3 sets)
    const exercisesWithSets = exercises.map(ex => {
      const setsMatch = (ex.sets || '3').match(/(\d+)\s*[×x]/i);
      const numSets = setsMatch ? parseInt(setsMatch[1]) : 3;
      
      // Get last session for pre-filling weights
      const lastData = getLastSessionData(sessionType, ex.name);
      
      const sets = [];
      for (let i = 0; i < numSets; i++) {
        const lastSet = lastData?.sets?.[i];
        sets.push({
          weight: lastSet?.weight || '',
          reps: lastSet?.reps || ''
        });
      }
      return { name: ex.name, sets, numSets };
    });

    // Create modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'gym-log-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 600px; max-height: 85vh; overflow-y: auto;">
        <div class="modal-title">📝 Loghează: ${currentPrograms[sessionType]?.name || 'Conditioning'}</div>
        <div style="font-size: 12px; color: var(--text-tertiary); margin-bottom: var(--space-lg);">
          Introdu greutatea (kg) și repetările pentru fiecare set. Datele din sesiunea anterioară sunt pre-completate.
        </div>
        
        <div id="gym-log-exercises">
          ${exercisesWithSets.map((ex, ei) => `
            <div class="gym-log-exercise" data-index="${ei}">
              <div class="gym-log-exercise-name">${ex.name}</div>
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
          `).join('')}
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-ghost" id="gym-log-cancel">Anulează</button>
          <button type="button" class="btn btn-primary" id="gym-log-save">💾 Salvează Sesiunea</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Close handlers
    modal.querySelector('#gym-log-cancel').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

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

    // Remove Set buttons (Event Delegation)
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-set-btn')) {
        const row = e.target.closest('.gym-log-set-row');
        const container = row.closest('.gym-log-sets');
        row.remove();
        
        // Re-number remaining sets
        container.querySelectorAll('.gym-log-set-row').forEach((r, i) => {
          r.querySelector('.gym-log-set-num').textContent = i + 1;
          r.querySelector('.gym-log-weight').dataset.set = i;
          r.querySelector('.gym-log-reps').dataset.set = i;
        });
      }
    });

    // Save handler
    modal.querySelector('#gym-log-save').addEventListener('click', () => {
      const logExercises = exercisesWithSets.map((ex, ei) => {
        const setRows = modal.querySelectorAll(`.gym-log-weight[data-ex="${ei}"]`);
        const sets = [];
        let totalVolume = 0;
        
        setRows.forEach((weightInput, si) => {
          const repsInput = modal.querySelector(`.gym-log-reps[data-ex="${ei}"][data-set="${si}"]`);
          const weight = parseFloat(weightInput.value) || 0;
          const reps = parseInt(repsInput?.value) || 0;
          if (weight > 0 || reps > 0) {
            sets.push({ weight, reps });
            totalVolume += weight * reps;
          }
        });

        return {
          name: ex.name,
          sets,
          totalVolume,
          plannedSets: exercises[ei]?.sets || '',
          completed: sets.length > 0
        };
      });

      storage.saveGymSession(dateStr, sessionType, logExercises);
      
      // Also save as a workout log for the dashboard tracking
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
      render(); // Re-render to show logged data
      
      // If we are in the dashboard modal, re-render the current route to reflect changes
      import('./router.js').then(({ renderCurrentRoute }) => renderCurrentRoute());
    });
  }

  render();
  return page;
}

export function getDashboardGymCardNode(title, dateStr) {
  const page = renderGymPage();
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
