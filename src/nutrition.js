// ============================================
// Nutrition & Lifestyle Page
// ============================================

import { NUTRITION, getDailyNutritionTargets } from './data.js';
import { storage } from './storage.js';

let isEditSupplementsMode = false;
let customSupplements = null;

export function renderNutritionPage() {
  const page = document.createElement('div');
  page.className = 'nutrition-page';

  customSupplements = storage.getCustomSupplements(NUTRITION.supplements);
  
  let currentDate = new Date().toISOString().split('T')[0];
  
  function render() {
    const dailyLog = storage.getDailyLog(currentDate);
    const supplementsLog = storage.getSupplements(currentDate);
    
    // Calculate active calories from workouts on this date
    const workouts = storage.getWorkoutLog(currentDate) || [];
    const activeCalories = workouts.reduce((sum, w) => sum + (parseInt(w.calories) || 0), 0);
    
    // Get dynamic targets
    const targets = getDailyNutritionTargets(activeCalories);

    page.innerHTML = `
      <div class="page-body">
        <!-- Date Picker -->
        <div class="date-picker-bar animate-in">
          <button class="btn btn-ghost btn-sm" id="prev-day">← Ieri</button>
          <input type="date" class="form-input" id="nutrition-date" value="${currentDate}" style="max-width: 180px; text-align: center;" />
          <button class="btn btn-ghost btn-sm" id="next-day">Mâine →</button>
        </div>

        ${activeCalories > 0 ? `
          <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid var(--accent); padding: var(--space-md); border-radius: var(--radius-md); margin-top: var(--space-lg); display: flex; align-items: center; gap: var(--space-md);">
            <div style="font-size: 24px;">🔥</div>
            <div>
              <div style="font-weight: 600; color: var(--accent);">Te-ai antrenat azi! (${activeCalories} kcal arse)</div>
              <div style="font-size: 13px; color: var(--text-secondary);">Obiectivele tale de calorii și carbohidrați au fost ajustate automat pentru a-ți asigura recuperarea.</div>
            </div>
          </div>
        ` : ''}

        <div class="grid-2" style="margin-top: var(--space-lg)">
          <!-- Macros -->
          <div class="card animate-in animate-in-delay-1">
            <div class="card-header">
              <div class="card-title">🍎 Macronutrienți</div>
            </div>
            <div class="macro-inputs">
              ${renderMacroInput('Calorii', 'calories', dailyLog.calories, `Target: ${targets.targetCalories}`, 'kcal', targets.targetCalories)}
              ${renderMacroInput('Proteine', 'protein', dailyLog.protein, `Target: ${targets.protein}g`, 'g', targets.protein, 'protein')}
              ${renderMacroInput('Carbohidrați', 'carbs', dailyLog.carbs, `Target: ${targets.carbs}g`, 'g', targets.carbs, 'carbs')}
              ${renderMacroInput('Grăsimi', 'fat', dailyLog.fat, `Target: ${targets.fat}g`, 'g', targets.fat, 'fat')}
              ${renderMacroInput('Apă', 'water', dailyLog.water, 'Target: 3-4 litri', 'L', 4)}
            </div>
          </div>

          <!-- Body & Recovery -->
          <div class="card animate-in animate-in-delay-2">
            <div class="card-header">
              <div class="card-title">💤 Corp & Recuperare</div>
            </div>
            <div class="macro-inputs">
              ${renderMacroInput('Greutate', 'weight', dailyLog.weight, 'kg', 'kg', 100)}
              ${renderMacroInput('Somn', 'sleep', dailyLog.sleep, 'Target: 7.5-8h', 'ore', 10)}
              
              <div class="form-group">
                <label class="form-label">RPE Zilnic (cum te simți?)</label>
                <div class="rpe-slider" id="rpe-slider">
                  ${[1,2,3,4,5,6,7,8,9,10].map(n => `
                    <div class="rpe-dot ${dailyLog.rpe === n ? (n >= 8 ? 'active high' : 'active') : ''}" data-rpe="${n}">${n}</div>
                  `).join('')}
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Note</label>
                <textarea class="form-input" id="daily-notes" placeholder="Cum te-ai simțit azi? Observații..." rows="3" style="resize: vertical">${dailyLog.notes || ''}</textarea>
              </div>
            </div>
          </div>
        </div>

        <!-- Supplements -->
        <div class="card animate-in animate-in-delay-3" style="margin-top: var(--space-lg)">
          <div class="card-header">
            <div class="card-title">💊 Suplimente</div>
            <button class="btn btn-ghost btn-sm" id="toggle-edit-supplements">
              ${isEditSupplementsMode ? '💾 Salvează' : '✏️ Editează Lista'}
            </button>
          </div>
          <div class="${isEditSupplementsMode ? 'supplements-edit-list' : 'supplements-grid'}" id="supplements-container">
            ${customSupplements.map((s, idx) => {
              if (isEditSupplementsMode) {
                return `
                  <div class="supplement-edit-row" data-index="${idx}" style="display: flex; gap: var(--space-sm); margin-bottom: var(--space-sm);">
                    <input type="text" class="form-input supp-name" value="${s.name}" placeholder="Nume Supliment" style="flex: 2;" />
                    <input type="text" class="form-input supp-dose" value="${s.dose}" placeholder="Doză (ex: 5g)" style="flex: 1;" />
                    <button class="btn btn-ghost btn-sm supp-remove-btn" data-index="${idx}" style="color: var(--danger); padding: 0 10px;">❌</button>
                  </div>
                `;
              } else {
                return `
                  <div class="supplement-item ${supplementsLog[s.name] ? 'taken' : ''}" data-supplement="${s.name}">
                    <div class="supplement-check">${supplementsLog[s.name] ? '✓' : ''}</div>
                    <div class="supplement-info">
                      <div class="supplement-name">${s.name}</div>
                      <div class="supplement-dose">${s.dose}</div>
                    </div>
                  </div>
                `;
              }
            }).join('')}
          </div>
          ${isEditSupplementsMode ? `
            <button class="btn btn-ghost btn-sm" id="add-supplement-btn" style="width: 100%; border-style: dashed; margin-top: var(--space-md);">
              ➕ Adaugă Supliment
            </button>
          ` : ''}
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    const dateInput = page.querySelector('#nutrition-date');
    
    // Macro inputs
    page.querySelectorAll('.macro-field').forEach(input => {
      input.addEventListener('change', () => {
        const date = dateInput.value;
        const field = input.dataset.field;
        const value = parseFloat(input.value) || 0;
        storage.saveDailyLog(date, { [field]: value });
        updateMacroBar(input);
      });
    });

    // RPE slider
    page.querySelectorAll('.rpe-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        const rpe = parseInt(dot.dataset.rpe);
        const date = dateInput.value;
        page.querySelectorAll('.rpe-dot').forEach(d => {
          d.classList.remove('active', 'high');
        });
        dot.classList.add('active');
        if (rpe >= 8) dot.classList.add('high');
        storage.saveDailyLog(date, { rpe });
      });
    });

    // Notes
    const notesEl = page.querySelector('#daily-notes');
    let notesTimeout;
    notesEl?.addEventListener('input', () => {
      clearTimeout(notesTimeout);
      notesTimeout = setTimeout(() => {
        storage.saveDailyLog(dateInput.value, { notes: notesEl.value });
      }, 500);
    });

    // Supplements Togging (View Mode)
    if (!isEditSupplementsMode) {
      page.querySelectorAll('.supplement-item').forEach(item => {
        item.addEventListener('click', () => {
          const name = item.dataset.supplement;
          const taken = storage.toggleSupplement(dateInput.value, name);
          item.classList.toggle('taken', taken);
          item.querySelector('.supplement-check').textContent = taken ? '✓' : '';
        });
      });
    }

    // Supplements Editing Mode
    const editBtn = page.querySelector('#toggle-edit-supplements');
    editBtn?.addEventListener('click', () => {
      if (isEditSupplementsMode) {
        // Save changes before exiting edit mode
        saveSupplementsEdits();
        storage.saveCustomSupplements(customSupplements);
      }
      isEditSupplementsMode = !isEditSupplementsMode;
      render();
    });

    if (isEditSupplementsMode) {
      page.querySelector('#add-supplement-btn')?.addEventListener('click', () => {
        saveSupplementsEdits();
        customSupplements.push({ name: 'Nou Supliment', dose: '1 porție' });
        render();
      });

      page.querySelectorAll('.supp-remove-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          saveSupplementsEdits();
          const idx = parseInt(btn.dataset.index);
          customSupplements.splice(idx, 1);
          render();
        });
      });
    }

    // Date navigation
    page.querySelector('#prev-day')?.addEventListener('click', () => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - 1);
      currentDate = d.toISOString().split('T')[0];
      isEditSupplementsMode = false; // reset edit mode on date change
      render();
    });

    page.querySelector('#next-day')?.addEventListener('click', () => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + 1);
      currentDate = d.toISOString().split('T')[0];
      isEditSupplementsMode = false;
      render();
    });

    dateInput?.addEventListener('change', () => {
      currentDate = dateInput.value;
      isEditSupplementsMode = false;
      render();
    });
  }

  function saveSupplementsEdits() {
    const rows = page.querySelectorAll('.supplement-edit-row');
    rows.forEach((row, idx) => {
      const name = row.querySelector('.supp-name')?.value;
      const dose = row.querySelector('.supp-dose')?.value;
      if (name && customSupplements[idx]) {
        customSupplements[idx].name = name;
        customSupplements[idx].dose = dose;
      }
    });
  }

  render();
  return page;
}

function renderMacroInput(label, field, value, hint, unit, target, barClass) {
  const pct = target ? Math.min(100, Math.round(((value || 0) / target) * 100)) : 0;
  return `
    <div class="form-group">
      <label class="form-label">${label} <span style="color: var(--text-tertiary); text-transform: none; letter-spacing: 0; font-weight: 400">${hint}</span></label>
      <div style="display: flex; align-items: center; gap: 8px;">
        <input type="number" class="form-input macro-field" data-field="${field}" value="${value || ''}" placeholder="" style="flex:1" />
        <span style="color: var(--text-tertiary); font-size: 12px; min-width: 30px">${unit}</span>
      </div>
      ${barClass ? `<div class="macro-bar"><div class="macro-bar-fill ${barClass}" style="width: ${pct}%" data-field="${field}"></div></div>` : ''}
    </div>
  `;
}

function updateMacroBar(input) {
  const field = input.dataset.field;
  const bar = input.closest('.form-group')?.querySelector('.macro-bar-fill');
  if (bar) {
    const target = parseFloat(bar.closest('.macro-bar').previousElementSibling?.querySelector('.macro-field')?.max) || 100;
    const value = parseFloat(input.value) || 0;
    bar.style.width = Math.min(100, Math.round((value / target) * 100)) + '%';
  }
}
