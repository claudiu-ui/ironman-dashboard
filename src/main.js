// ============================================
// IRONMAN DASHBOARD — Main Entry
// ============================================

import './style.css';
import './extra.css';
import { registerRoute, navigate, initRouter, renderCurrentRoute } from './router.js';
import { renderDashboard } from './dashboard.js';
import { renderGymPage } from './gym.js';
import { renderNutritionPage } from './nutrition.js';
import { renderAnalyticsPage } from './analytics.js';
import { renderSettingsPage } from './settings.js';
import { renderGearPage } from './gear.js';
import { renderFuelingPage } from './fueling.js';
import { getCurrentWeek, getCurrentPhase, getDaysUntilRace } from './data.js';
import { syncIntervalsWorkouts } from './settings.js';
import { storage } from './storage.js';

// Register routes
registerRoute('/', renderDashboard);
registerRoute('/gym', renderGymPage);
registerRoute('/nutrition', renderNutritionPage);
registerRoute('/analytics', renderAnalyticsPage);
registerRoute('/settings', renderSettingsPage);
registerRoute('/gear', renderGearPage);
registerRoute('/fueling', renderFuelingPage);

// Build App Shell
function buildApp() {
  const app = document.getElementById('app');
  const weekNum = getCurrentWeek();
  const phase = getCurrentPhase(weekNum);
  const daysLeft = getDaysUntilRace();

  app.innerHTML = `
    <!-- Mobile Toggle -->
    <button class="mobile-toggle" id="mobile-toggle">☰</button>
    <div class="mobile-overlay" id="mobile-overlay"></div>

    <!-- Sidebar -->
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo">
          <div class="sidebar-logo-icon">IM</div>
          <div class="sidebar-logo-text">
            <span class="title">IRONMAN DASHBOARD</span>
            <span class="subtitle">Claudiu Iordache • BUILT</span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="sidebar-section-label">Principal</div>
        <a class="sidebar-link active" data-route="/" onclick="event.preventDefault()">
          <span class="nav-icon">📊</span>
          Dashboard
        </a>
        <a class="sidebar-link" data-route="/gym" onclick="event.preventDefault()">
          <span class="nav-icon">🏋️</span>
          Program Sală
        </a>
        <a class="sidebar-link" data-route="/nutrition" onclick="event.preventDefault()">
          <span class="nav-icon">🍎</span>
          Nutriție & Lifestyle
        </a>
        <a class="sidebar-link" data-route="/analytics" onclick="event.preventDefault()">
          <span class="nav-icon">📈</span>
          Analytics
        </a>
        <a class="sidebar-link" data-route="/fueling" onclick="event.preventDefault()">
          <span class="nav-icon">🚀</span>
          Race & Fueling
        </a>
        <a class="sidebar-link" data-route="/gear" onclick="event.preventDefault()">
          <span class="nav-icon">👟</span>
          Echipament
        </a>

        <a class="sidebar-link" data-route="/settings" onclick="event.preventDefault()">
          <span class="nav-icon">⚙️</span>
          Setări
        </a>

        <div class="sidebar-section-label" style="margin-top: var(--space-lg)">Quick Actions</div>
        <a class="sidebar-link" id="log-workout-btn" onclick="event.preventDefault()">
          <span class="nav-icon">➕</span>
          Loghează Antrenament
        </a>
        <a class="sidebar-link" id="export-data-btn" onclick="event.preventDefault()">
          <span class="nav-icon">💾</span>
          Exportă Date
        </a>
        <a class="sidebar-link" id="import-data-btn" onclick="event.preventDefault()">
          <span class="nav-icon">📂</span>
          Importă Date
        </a>
        <input type="file" id="import-data-file" accept=".json" style="display: none;" />
      </nav>

      <div class="sidebar-footer">
        <div class="sidebar-phase-badge" style="--phase-color: ${phase.color}; background: ${phase.color}15; color: ${phase.color}; border-color: ${phase.color}33;">
          <span class="phase-dot" style="background: ${phase.color}"></span>
          ${phase.icon} ${phase.name} — Săpt ${weekNum}/48
        </div>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <header class="page-header">
        <div class="page-header-inner">
          <h1 class="page-title" id="page-title">Dashboard</h1>
          <div class="page-header-right">
            <div class="header-countdown">
              🏁 Race Day în <span class="countdown-number">${daysLeft}</span> zile
            </div>
          </div>
        </div>
      </header>
      <div id="page-content"></div>
    </main>

    <!-- Log Workout Modal -->
    <div class="modal-overlay" id="log-modal">
      <div class="modal">
        <div class="modal-title">➕ Loghează Antrenament</div>
        <form id="log-form">
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Dată</label>
              <input type="date" class="form-input" id="log-date" required />
            </div>
            <div class="form-group">
              <label class="form-label">Tip</label>
              <select class="form-input" id="log-type">
                <option value="swim">🏊 Înot</option>
                <option value="run">🏃 Alergare</option>
                <option value="bike">🚴 Bicicletă</option>
                <option value="gym">🏋️ Sală</option>
                <option value="conditioning">💪 Conditioning</option>
                <option value="rest">🤒 Odihnă / Boală / Ratat</option>
              </select>
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Distanță</label>
              <input type="number" class="form-input" id="log-distance" placeholder="km sau m" step="0.1" />
            </div>
            <div class="form-group">
              <label class="form-label">Durată (minute)</label>
              <input type="number" class="form-input" id="log-duration" placeholder="min" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">HR mediu (bpm)</label>
              <input type="number" class="form-input" id="log-hr" placeholder="bpm" />
            </div>
            <div class="form-group">
              <label class="form-label">RPE (1-10)</label>
              <input type="number" class="form-input" id="log-rpe" min="1" max="10" placeholder="1-10" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group" id="log-gear-group" style="display: none;">
              <label class="form-label">Echipament (Opțional)</label>
              <select class="form-input" id="log-gear">
                <option value="">-- Fără Echipament --</option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Note</label>
            <textarea class="form-input" id="log-notes" rows="2" placeholder="Cum a fost?"></textarea>
          </div>
          <div style="display: flex; gap: 12px; justify-content: flex-end">
            <button type="button" class="btn btn-ghost" id="log-cancel">Anulează</button>
            <button type="submit" class="btn btn-primary">💾 Salvează</button>
          </div>
        </form>
        </form>
      </div>
    </div>

    <!-- Workout Details Modal (Dual Mode: Plan vs. Results) -->
    <div class="modal-overlay" id="workout-details-modal">
      <div class="modal" style="max-width: 600px; max-height: 85vh; overflow-y: auto;">
        <div class="modal-title" id="wd-title">Detalii Antrenament</div>
        
        <!-- Tabs: Plan vs Results -->
        <div class="wd-tabs" id="wd-tabs" style="display: flex; gap: 0; margin-bottom: var(--space-lg); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); overflow: hidden;">
          <button class="wd-tab active" id="wd-tab-plan" style="flex: 1; padding: 10px; background: var(--accent); color: white; border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">📋 Plan & Coaching</button>
          <button class="wd-tab" id="wd-tab-results" style="flex: 1; padding: 10px; background: var(--bg-glass); color: var(--text-secondary); border: none; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s;">📊 Rezultate Reale</button>
        </div>

        <!-- Plan View -->
        <div id="wd-plan-view">
          <div class="wd-section">
            <div class="wd-section-title">Tinte & Focus (Targets)</div>
            <ul class="wd-targets-list" id="wd-targets"></ul>
          </div>

          <div class="wd-section" style="margin-top: var(--space-md)">
            <div class="wd-section-title">Structură Sesiune</div>
            <div class="wd-structure-list" id="wd-structure"></div>
          </div>

          <div class="wd-section" style="margin-top: var(--space-md)" id="wd-coaching-notes-section">
            <div class="wd-section-title">🎯 Note Antrenor (pentru tine, Claudiu)</div>
            <div id="wd-coaching-notes" style="font-size: 13px; color: var(--text-secondary); line-height: 1.7; padding: 12px; background: rgba(139, 92, 246, 0.06); border-radius: var(--radius-md); border: 1px solid rgba(139, 92, 246, 0.15);"></div>
          </div>
        </div>

        <!-- Results View (hidden by default) -->
        <div id="wd-results-view" style="display: none;">
          <div id="wd-results-content">
            <p style="color: var(--text-tertiary); text-align: center; padding: var(--space-xl);">Acest antrenament nu a fost încă completat.</p>
          </div>
        </div>

        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: var(--space-lg); padding-top: var(--space-md); border-top: 1px solid var(--border-subtle);">
          <button type="button" class="btn btn-ghost" id="wd-cancel">Închide</button>
          <button type="button" class="btn btn-ghost" id="wd-skip-btn" style="color: var(--danger); border: 1px solid rgba(239,68,68,0.3);">⏭️ Skip Sesiune</button>
          <button type="button" class="btn btn-primary" id="wd-log-btn">🏁 Finalizează & Loghează</button>
        </div>
      </div>
    </div>

    <!-- Session Swap Modal -->
    <div class="modal-overlay" id="swap-modal">
      <div class="modal" style="max-width: 400px;">
        <div class="modal-title">🔄 Mută Sesiunea</div>
        <p style="font-size: 13px; color: var(--text-secondary); margin-bottom: var(--space-lg);">Selectează ziua în care vrei să muți această sesiune:</p>
        <div id="swap-options" style="display: flex; flex-direction: column; gap: 8px;"></div>
        <div style="display: flex; gap: 12px; justify-content: flex-end; margin-top: var(--space-lg);">
          <button type="button" class="btn btn-ghost" id="swap-cancel">Anulează</button>
        </div>
      </div>
    </div>
  `;

  // Setup navigation
  const pageTitles = {
    '/': 'Dashboard',
    '/gym': 'Program Sală',
    '/nutrition': 'Nutriție & Lifestyle',
    '/analytics': 'Analytics',
    '/gear': 'Echipament',
    '/fueling': 'Nutriție Cursă',
    '/settings': 'Setări',
  };

  document.querySelectorAll('.sidebar-link[data-route]').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const route = link.dataset.route;
      navigate(route);
      document.getElementById('page-title').textContent = pageTitles[route] || 'Dashboard';
      // Close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('mobile-overlay').classList.remove('active');
    });
  });

  // Mobile toggle
  document.getElementById('mobile-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('mobile-overlay').classList.toggle('active');
  });

  document.getElementById('mobile-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('mobile-overlay').classList.remove('active');
  });

  // Log workout modal
  const logModal = document.getElementById('log-modal');
  const logDateInput = document.getElementById('log-date');
  const logTypeInput = document.getElementById('log-type');
  const logDistanceInput = document.getElementById('log-distance');
  const logDurationInput = document.getElementById('log-duration');
  const logNotesInput = document.getElementById('log-notes');

  window.openLogModal = (type = 'run', dateStr = null, distance = '', duration = '', notes = '') => {
    logDateInput.value = dateStr || new Date().toISOString().split('T')[0];
    logTypeInput.value = type;
    logDistanceInput.value = distance;
    logDurationInput.value = duration;
    logNotesInput.value = notes;
    logModal.classList.add('active');
  };

  // ============================================
  // Workout Details Modal — Dual Mode
  // ============================================
  const wdModal = document.getElementById('workout-details-modal');
  let currentWdType = 'run';
  let currentWdDate = null;
  let currentWdTitle = '';
  let currentWdDetail = '';
  let currentWdPrescription = null;

  const tabPlan = document.getElementById('wd-tab-plan');
  const tabResults = document.getElementById('wd-tab-results');
  const planView = document.getElementById('wd-plan-view');
  const resultsView = document.getElementById('wd-results-view');

  tabPlan?.addEventListener('click', () => {
    tabPlan.classList.add('active');
    tabPlan.style.background = 'var(--accent)';
    tabPlan.style.color = 'white';
    tabResults.classList.remove('active');
    tabResults.style.background = 'var(--bg-glass)';
    tabResults.style.color = 'var(--text-secondary)';
    planView.style.display = '';
    resultsView.style.display = 'none';
  });

  tabResults?.addEventListener('click', () => {
    tabResults.classList.add('active');
    tabResults.style.background = 'var(--success)';
    tabResults.style.color = 'white';
    tabPlan.classList.remove('active');
    tabPlan.style.background = 'var(--bg-glass)';
    tabPlan.style.color = 'var(--text-secondary)';
    resultsView.style.display = '';
    planView.style.display = 'none';
  });

  window.openWorkoutDetails = (weekNum, type, title, detail, dateStr) => {
    currentWdType = type;
    currentWdDate = dateStr;
    currentWdTitle = title;
    currentWdDetail = detail;
    
    // Reset to plan tab
    tabPlan?.click();
    
    import('./data.js').then(({ getWorkoutPrescription, HR_ZONES, ATHLETE, getCurrentPhase }) => {
      const prescription = getWorkoutPrescription(weekNum, type, title, detail);
      currentWdPrescription = prescription;
      const phase = getCurrentPhase(weekNum);
      
      document.getElementById('wd-title').innerHTML = `${title} — ${detail}`;
      
      const targetsList = document.getElementById('wd-targets');
      const structureList = document.getElementById('wd-structure');
      const structureTitle = structureList.previousElementSibling;
      
      if (type === 'gym' || type === 'conditioning') {
        targetsList.parentElement.style.display = 'none';
        if (structureTitle) structureTitle.style.display = 'none';
        
        import('./gym.js').then(({ getDashboardGymCardNode }) => {
          const card = getDashboardGymCardNode(title, dateStr);
          if (card) {
            structureList.innerHTML = '';
            structureList.appendChild(card);
          } else {
            structureList.innerHTML = '<p>Nu s-a putut încărca programul de sală.</p>';
          }
        });
      } else {
        targetsList.parentElement.style.display = 'block';
        if (structureTitle) structureTitle.style.display = 'block';
        
        targetsList.innerHTML = prescription.targets.map(t => `<li>${t}</li>`).join('');
        structureList.innerHTML = prescription.structure.map(s => `
          <div class="wd-step">
            <div class="wd-step-name">${s.name}</div>
            <div class="wd-step-desc">${s.desc}</div>
          </div>
        `).join('');
      }

      // Personalized coaching notes based on athlete profile
      const coachingNotes = getCoachingNotes(type, title, weekNum, phase, ATHLETE);
      document.getElementById('wd-coaching-notes').innerHTML = coachingNotes;
      
      // Check if workout is completed — populate results tab
      import('./storage.js').then(({ storage }) => {
        const logs = storage.getWorkoutLog(dateStr);
        const completedLog = logs?.find(l => l.type === type);
        
        if (completedLog) {
          tabResults.style.display = '';
          const resultsContent = document.getElementById('wd-results-content');
          
          if (completedLog.isSkipped) {
            resultsContent.innerHTML = `
              <div style="text-align: center; padding: var(--space-xl);">
                <div style="font-size: 32px; margin-bottom: 16px;">⏭️</div>
                <h3 style="color: var(--text-primary); margin-bottom: 8px;">Sesiune Sărită (Skipped)</h3>
                <p style="color: var(--text-secondary); margin-bottom: var(--space-lg);">Ai ales să sari peste acest antrenament.</p>
                <button class="btn btn-primary" id="wd-undo-skip-btn">↩️ Anulează Skip-ul (Undo)</button>
              </div>
            `;
            setTimeout(() => {
              const undoBtn = document.getElementById('wd-undo-skip-btn');
              if (undoBtn) {
                undoBtn.addEventListener('click', () => {
                  storage.deleteWorkout(dateStr, completedLog.id);
                  document.getElementById('workout-details-modal').classList.remove('active');
                  import('./router.js').then(({ renderCurrentRoute }) => renderCurrentRoute());
                });
              }
            }, 0);
          } else {
            resultsContent.innerHTML = renderCompletedMetrics(completedLog, type, HR_ZONES);
          }
          
          // Auto-switch to results if completed or skipped
          tabResults?.click();
          
          // Hide log button for normal workouts
          // For gym workouts, we hide the default log button because the Gym Card has its own button
          document.getElementById('wd-log-btn').style.display = 'none';
          const skipBtn = document.getElementById('wd-skip-btn');
          if (skipBtn) skipBtn.style.display = 'none';
        } else {
          tabResults.style.display = '';
          document.getElementById('wd-results-content').innerHTML = '<p style="color: var(--text-tertiary); text-align: center; padding: var(--space-xl);">Acest antrenament nu a fost încă completat. Finalizează-l mai întâi!</p>';
          
          // Hide default log button if it's a gym session (gym card has its own)
          document.getElementById('wd-log-btn').style.display = (type === 'gym' || type === 'conditioning') ? 'none' : '';
          const skipBtn = document.getElementById('wd-skip-btn');
          if (skipBtn) skipBtn.style.display = (type === 'gym' || type === 'conditioning') ? 'none' : '';
        }
      });
      
      wdModal.classList.add('active');
    });
  };

  // Coaching Notes Generator
  function getCoachingNotes(type, title, weekNum, phase, athlete) {
    const notes = [];
    
    if (type === 'run') {
      if (title.toLowerCase().includes('long')) {
        notes.push(`<strong>⚡ ${athlete.name}, alergarea lungă este BAZA Ironman-ului.</strong> Controlează-ți pulsul obsesiv — sub 136 BPM. Dacă trece, MERGI. Nu e rușine, e inteligență.`);
        notes.push(`🍌 Nutriție: Ia un gel la fiecare 45 min. Testezi exact ce vei face pe Race Day (stomacul trebuie antrenat).`);
        notes.push(`⚠️ Atenție la femuralul drept: dacă simți orice disconfort, scurtează sesiunea. Sănătatea > Planul.`);
      } else if (title.toLowerCase().includes('easy') || title.toLowerCase().includes('club')) {
        notes.push(`<strong>🧘 Asta e sesiune de RECUPERARE.</strong> Dacă te simți bine și vrei să forțezi, REZISTĂ tentației. Adaptarea musculară se face la efort MIC, nu mare.`);
        notes.push(`👃 Test simplu: dacă poți respira doar pe nas tot timpul, ești în zona corectă.`);
      } else if (title.toLowerCase().includes('tempo')) {
        notes.push(`<strong>🔥 Tempo = Pragul tău anaerob.</strong> Aici construiești viteză. Menține o cadență de 170-180 pași/min.`);
        notes.push(`📊 Compară pace-ul de azi cu cel de săptămâna trecută. Dacă e mai bun la același puls → progres REAL.`);
      }
    } else if (type === 'bike') {
      if (title.toLowerCase().includes('long')) {
        notes.push(`<strong>🚴 Long Ride = Simulare de cursă.</strong> Practică nutriția pe bicicletă: 60g Carbs/oră (gel + băutură).`);
        notes.push(`📐 Alternează 15 min aero-bars cu 5 min pe hood-uri. Confortul pe aero-bars decide câte minute câștigi la Ironman.`);
        notes.push(`💧 Bea electroliți la fiecare 15 minute, nu aștepta să ți se facă sete.`);
      } else {
        notes.push(`<strong>🔄 Sesiune de recuperare activă.</strong> Picioarele tale au nevoie de flux de sânge, nu de stres.`);
        notes.push(`🦵 Cadență mare (>95 RPM), forță mică. Gândește-te că "masezi" mușchii cu pedalarea.`);
      }
    } else if (type === 'swim') {
      if (phase.id === 'foundation') {
        notes.push(`<strong>🏊 Faza de Fundație = TEHNICA înainte de tot.</strong> Nu te grăbi. Concentrează-te pe alunecare (glide) și rotația bazinului.`);
        notes.push(`🎯 Numără brațele: dacă faci mai puțin de 18 pe 25m, tehnica ta e pe drumul bun.`);
      } else {
        notes.push(`<strong>🏊 Acum construiești anduranță specifică de cursă.</strong> CSS (Critical Swim Speed) = pace-ul pe care îl poți menține 30 min fără degradare.`);
      }
      notes.push(`⚠️ Bazin de ${athlete.pool}: ajustează pauzele la perete (10-15s max, nu 30s).`);
    } else if (type === 'gym') {
      notes.push(`<strong>🏋️ Sala este suportul invizibil al Ironman-ului.</strong> Previne accidentări și crește economia de mișcare.`);
      notes.push(`⚠️ Femuralul drept: pe Leg Curls, folosește maxim 60% din greutatea normală. RIR minim 3.`);
      notes.push(`📈 Progressive Overload: urcă cu 2.5kg sau 1 rep față de sesiunea anterioară. Dacă nu poți, menține.`);
    } else if (type === 'conditioning') {
      notes.push(`<strong>💪 Conditioning-ul Hyrox simulează stresul metabolic din Ironman.</strong> Pace constant = cheia.`);
      notes.push(`🧠 NU sprinta în prima rundă. Începe la 70% efort și crește treptat.`);
    }

    // Phase-specific note
    if (phase.id === 'foundation') {
      notes.push(`📅 <em>Faza Fundație (Săpt ${weekNum}/16):</em> Acum construiești baza aerobă. 80% din antrenamente trebuie să fie ușoare. Răbdare.`);
    } else if (phase.id === 'build') {
      notes.push(`📅 <em>Faza Build (Săpt ${weekNum}):</em> Intensitatea crește. Monitorizează oboseala (RPE) — dacă 3 zile consecutive sunt >7, ia o zi liberă.`);
    }
    
    return notes.join('<br><br>');
  }

  // Render completed workout metrics (like Coros/Garmin)
  function renderCompletedMetrics(log, type, hrZones) {
    const dist = parseFloat(log.distance) || 0;
    const dur = parseInt(log.duration) || 0;
    const hr = parseInt(log.hr) || 0;
    const hrMax = parseInt(log.hrMax) || 0;
    const cadence = parseInt(log.cadence) || 0;
    const calories = parseInt(log.calories) || 0;
    const elevation = parseInt(log.elevation) || 0;
    const power = parseInt(log.power) || 0;
    const pace = log.pace || (dist > 0 && dur > 0 && type === 'run' ? `${Math.floor(dur/dist)}:${String(Math.round((dur/dist%1)*60)).padStart(2,'0')}/km` : null);
    const speed = log.speed || (dist > 0 && dur > 0 && type === 'bike' ? (dist/(dur/60)).toFixed(1) : null);
    
    // Determine HR zone
    const zone = hr > 0 ? hrZones.find(z => hr >= z.bpmMin && hr <= z.bpmMax) : null;
    
    // Build metrics grid
    let html = `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: var(--space-lg);">`;
    
    if (dist > 0) html += metricCard('📏 Distanță', `${dist.toFixed(2)} km`, type === 'swim' ? 'var(--swim)' : type === 'run' ? 'var(--run)' : 'var(--bike)');
    if (dur > 0) html += metricCard('⏱ Durată', `${dur} min`, 'var(--text-primary)');
    if (pace) html += metricCard('🏃 Pace', pace, 'var(--run)');
    if (speed) html += metricCard('🚴 Viteză', `${speed} km/h`, 'var(--bike)');
    if (hr > 0) html += metricCard('❤️ HR Mediu', `${hr} bpm`, 'var(--danger)');
    if (hrMax > 0) html += metricCard('💓 HR Max', `${hrMax} bpm`, 'var(--danger)');
    if (zone) html += metricCard('🎯 Zona HR', `Z${zone.zone} (${zone.name})`, zone.zone <= 2 ? 'var(--success)' : zone.zone <= 3 ? 'var(--warning)' : 'var(--danger)');
    if (cadence > 0) html += metricCard(type === 'run' ? '🦶 Cadență' : '🔄 Cadență', `${cadence} ${type === 'run' ? 'spm' : 'rpm'}`, 'var(--info)');
    if (calories > 0) html += metricCard('🔥 Calorii', `${calories} kcal`, 'var(--warning)');
    if (elevation > 0) html += metricCard('⛰️ Elevație', `${elevation}m`, 'var(--text-primary)');
    if (power > 0) html += metricCard('⚡ Putere', `${power}W`, 'var(--warning)');
    
    html += `</div>`;
    
    // Gym Exercises (Sets & Reps)
    if (type === 'gym' || type === 'conditioning') {
      let exercisesArr = [];
      if (Array.isArray(log.exercises)) exercisesArr = log.exercises;
      else if (log.exercises && Array.isArray(log.exercises.exercises)) exercisesArr = log.exercises.exercises;
      
      if (exercisesArr.length > 0) {
        html += `<div style="margin-bottom: var(--space-lg);">
          <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--accent); margin-bottom: 12px; font-weight: 700;">Serii Logate</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">`;
        
        exercisesArr.forEach(ex => {
          if (ex.sets && ex.sets.length > 0) {
            const validSets = ex.sets.filter(s => s.weight || s.reps);
            if (validSets.length > 0) {
              html += `<div style="background: var(--bg-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px;">
                <div style="font-weight: 600; font-size: 13px; color: var(--text-primary); margin-bottom: 8px;">${ex.name}</div>`;
              validSets.forEach((s, i) => {
                html += `<div style="display: flex; justify-content: space-between; padding: 4px 0; border-top: 1px dashed var(--border-subtle); font-size: 13px;">
                  <span style="color: var(--text-tertiary);">Set ${i+1}</span>
                  <span style="color: var(--text-secondary); font-family: var(--font-mono);"><b>${s.weight || '-'}</b> kg × <b>${s.reps || '-'}</b></span>
                </div>`;
              });
              html += `</div>`;
            }
          }
        });
        
        html += `</div></div>`;
      }
    }
    
    // Notes
    if (log.notes) {
      html += `<div style="padding: 12px; background: var(--bg-glass); border-radius: var(--radius-md); border: 1px solid var(--border-subtle); margin-bottom: var(--space-md);">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-tertiary); margin-bottom: 4px; font-weight: 600;">Titlu Activitate</div>
        <div style="font-size: 14px; font-weight: 500;">${log.notes}</div>
      </div>`;
    }
    
    // Source
    if (log.source) {
      html += `<div style="font-size: 11px; color: var(--text-tertiary); text-align: right;">Sursă: ${log.source === 'intervals' ? '🔗 Coros via Intervals.icu' : '✏️ Manual'}</div>`;
    }
    
    return html;
  }

  function metricCard(label, value, color) {
    return `
      <div style="background: var(--bg-glass); border: 1px solid var(--border-subtle); border-radius: var(--radius-md); padding: 12px; text-align: center;">
        <div style="font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px;">${label}</div>
        <div style="font-size: 18px; font-weight: 700; color: ${color}; font-family: var(--font-mono);">${value}</div>
      </div>
    `;
  }

  document.getElementById('wd-cancel')?.addEventListener('click', () => wdModal.classList.remove('active'));
  wdModal?.addEventListener('click', (e) => {
    if (e.target === wdModal) wdModal.classList.remove('active');
  });

  document.getElementById('wd-skip-btn')?.addEventListener('click', () => {
    import('./storage.js').then(({ storage }) => {
      storage.saveWorkout(currentWdDate, {
        type: currentWdType,
        isSkipped: true,
        notes: 'Sesiune Skipped ⏭️',
        distance: 0,
        duration: 0,
        hr: 0
      });
      wdModal.classList.remove('active');
      renderCurrentRoute();
    });
  });

  document.getElementById('wd-log-btn')?.addEventListener('click', () => {
    wdModal.classList.remove('active');
    
    // Parse title and detail to prefill modal
    let parsedDist = '';
    let parsedDur = '';
    
    if (currentWdPrescription) {
      if (currentWdPrescription.calculatedDistanceKm) {
        parsedDist = currentWdPrescription.calculatedDistanceKm.toString();
      }
      if (currentWdPrescription.calculatedDurationMin) {
        parsedDur = currentWdPrescription.calculatedDurationMin.toString();
      }
    }
    
    // Set notes as the workout title
    const parsedNotes = currentWdTitle;
    
    window.openLogModal(currentWdType, currentWdDate, parsedDist, parsedDur, parsedNotes);
  });

  // ============================================
  // Session Swap (HTML5 Drag & Drop)
  // ============================================
  
  window.__handleDragStart = (dayIdx, sessionIdx, event) => {
    // Prevent the click event (openWorkoutDetails) from firing when dragging
    event.stopPropagation();
    event.dataTransfer.setData('dayIdx', dayIdx);
    event.dataTransfer.setData('sessionIdx', sessionIdx);
    event.dataTransfer.effectAllowed = 'move';
    
    // Add visual cue
    setTimeout(() => event.target.classList.add('dragging'), 0);
  };
  
  document.addEventListener('dragend', (e) => {
    document.querySelectorAll('.session-block.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.day-column.drag-over').forEach(el => el.classList.remove('drag-over'));
  });

  window.__handleDragOver = (event) => {
    event.preventDefault();
  };

  window.__handleDragEnter = (dayIdx, event) => {
    event.preventDefault();
    const col = document.getElementById(`day-column-${dayIdx}`);
    if (col) col.classList.add('drag-over');
  };

  window.__handleDragLeave = (dayIdx, event) => {
    const col = document.getElementById(`day-column-${dayIdx}`);
    if (col && !col.contains(event.relatedTarget)) {
      col.classList.remove('drag-over');
    }
  };

  window.__handleDrop = (toDayIdx, event) => {
    event.preventDefault();
    document.querySelectorAll('.day-column.drag-over').forEach(el => el.classList.remove('drag-over'));

    const fromDayIdx = parseInt(event.dataTransfer.getData('dayIdx'));
    const sessionIdx = parseInt(event.dataTransfer.getData('sessionIdx'));
    
    // If dropped on the same day or invalid, do nothing
    if (fromDayIdx === toDayIdx || isNaN(fromDayIdx)) return;
    
    import('./data.js').then(({ WEEKLY_TEMPLATE_PHASE1, getCurrentWeek }) => {
      import('./storage.js').then(({ storage }) => {
        const weekNum = getCurrentWeek();
        const weekScheduleKey = `week_schedule_${weekNum}`;
        
        // Get current customized schedule, or clone the base template
        let currentSchedule = storage.get(weekScheduleKey);
        if (!currentSchedule) {
          currentSchedule = JSON.parse(JSON.stringify(WEEKLY_TEMPLATE_PHASE1));
        }
        
        // Remove from source day
        const sessionToMove = currentSchedule[fromDayIdx].sessions.splice(sessionIdx, 1)[0];
        if (sessionToMove) {
          // Add to target day
          currentSchedule[toDayIdx].sessions.push(sessionToMove);
          
          // Sort target day sessions (e.g. by time if exists)
          currentSchedule[toDayIdx].sessions.sort((a, b) => {
            const timeA = a.time || '23:59';
            const timeB = b.time || '23:59';
            return timeA.localeCompare(timeB);
          });
          
          // Save customized schedule
          storage.set(weekScheduleKey, currentSchedule);
          
          // Refresh ONLY the week schedule DOM to avoid flashing and losing scroll
          import('./dashboard.js').then(({ renderDashboard }) => {
            const newPage = renderDashboard();
            const newSchedule = newPage.querySelector('.week-schedule');
            const currentScheduleContainer = document.querySelector('.week-schedule');
            
            if (newSchedule && currentScheduleContainer) {
              // Seamlessly update HTML
              currentScheduleContainer.innerHTML = newSchedule.innerHTML;
            }
          });
        }
      });
    });
  };

  document.getElementById('log-workout-btn')?.addEventListener('click', () => window.openLogModal());

  document.getElementById('log-cancel')?.addEventListener('click', () => {
    logModal.classList.remove('active');
  });
  
  const logGearGroup = document.getElementById('log-gear-group');
  const logGearInput = document.getElementById('log-gear');

  const updateGearOptions = (type) => {
    import('./storage.js').then(({ storage }) => {
      const gear = storage.getGear().filter(g => g.type === type && g.active);
      if (gear.length > 0) {
        logGearGroup.style.display = 'block';
        logGearInput.innerHTML = '<option value="">-- Fără Echipament --</option>' + 
          gear.map(g => `<option value="${g.id}">${g.name}</option>`).join('');
      } else {
        logGearGroup.style.display = 'none';
        logGearInput.innerHTML = '<option value="">-- Fără Echipament --</option>';
      }
    });
  };

  logTypeInput?.addEventListener('change', (e) => {
    updateGearOptions(e.target.value);
  });

  window.openLogModal = (type = 'run', dateStr = null, distance = '', duration = '', notes = '') => {
    logDateInput.value = dateStr || new Date().toISOString().split('T')[0];
    logTypeInput.value = type;
    logDistanceInput.value = distance;
    logDurationInput.value = duration;
    logNotesInput.value = notes;
    updateGearOptions(type);
    logModal.classList.add('active');
  };

  logModal?.addEventListener('click', (e) => {
    if (e.target === logModal) logModal.classList.remove('active');
  });

  document.getElementById('log-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const dateToSave = logDateInput.value || new Date().toISOString().split('T')[0];
    
    import('./storage.js').then(({ storage }) => {
      storage.saveWorkout(dateToSave, {
        type: logTypeInput.value,
        gearId: logGearInput.value || null,
        distance: parseFloat(document.getElementById('log-distance').value) || 0,
        duration: parseFloat(document.getElementById('log-duration').value) || 0,
        hr: parseFloat(document.getElementById('log-hr').value) || 0,
        rpe: parseInt(document.getElementById('log-rpe').value) || 0,
        notes: document.getElementById('log-notes').value,
      });
      logModal.classList.remove('active');
      document.getElementById('log-form').reset();
      logGearGroup.style.display = 'none';
      showToast('✅ Antrenament salvat!');
      renderCurrentRoute(); // Refresh UI
    });
  });

  // Export data
  document.getElementById('export-data-btn')?.addEventListener('click', () => {
    import('./storage.js').then(({ storage }) => {
      const data = storage.exportAll();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ironman-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('💾 Date exportate!');
    });
  });

  // Import data
  const importInput = document.getElementById('import-data-file');
  document.getElementById('import-data-btn')?.addEventListener('click', () => {
    importInput?.click();
  });

  importInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        const { storage } = await import('./storage.js');
        storage.importAll(data);
        showToast('📂 Date importate cu succes! Se reîncarcă...');
        setTimeout(() => location.reload(), 1500);
      } catch (err) {
        showToast('❌ Eroare la citirea fișierului: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset
  });

  // Init router
  initRouter();
}

function showToast(message, type = 'success') {
  const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
  const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--info)', warning: 'var(--warning)' };
  
  // Create container if not exists
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:10000;display:flex;flex-direction:column-reverse;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.style.cssText = `
    pointer-events:auto;
    display:flex;align-items:center;gap:10px;
    padding:12px 20px;border-radius:12px;
    background:rgba(20,20,20,0.95);backdrop-filter:blur(12px);
    border:1px solid ${colors[type]}33;
    box-shadow:0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03);
    font-size:13px;font-weight:500;color:var(--text-primary);
    transform:translateX(120%);opacity:0;
    transition:all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    max-width:380px;
  `;
  toast.innerHTML = `<span style="font-size:18px;flex-shrink:0;">${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);
  
  requestAnimationFrame(() => {
    toast.style.transform = 'translateX(0)';
    toast.style.opacity = '1';
  });
  
  // Haptic feedback on mobile
  if (navigator.vibrate) navigator.vibrate(50);
  
  setTimeout(() => {
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

// Make globally accessible
window.showToast = showToast;

// Initialize
buildApp();

// ── Smart Auto-Sync with cooldown ──────────────────────────────────────────
(async function smartAutoSync() {
  const SYNC_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes
  const lastSync = parseInt(localStorage.getItem('ironman_lastSyncTimestamp') || '0');
  const now = Date.now();
  
  const { athleteId, apiKey } = storage.getIntervalsSettings();
  if (!athleteId || !apiKey) return;
  
  // Skip if synced recently
  if (now - lastSync < SYNC_COOLDOWN_MS) {
    const ago = Math.round((now - lastSync) / 60000);
    console.log(`Auto-sync skipped (last sync ${ago}min ago)`);
    return;
  }
  
  try {
    const count = await syncIntervalsWorkouts(athleteId, apiKey);
    localStorage.setItem('ironman_lastSyncTimestamp', String(Date.now()));
    
    if (count > 0) {
      showToast(`🔄 Auto-sync: ${count} antrenamente noi de pe ceas`, 'info');
      renderCurrentRoute();
    }
  } catch (e) {
    console.warn('Auto-sync failed:', e.message);
  }
})();

// ── Weekly Backup Reminder ─────────────────────────────────────────────────
(function backupReminder() {
  const BACKUP_KEY = 'ironman_lastBackupReminder';
  const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
  const lastReminder = parseInt(localStorage.getItem(BACKUP_KEY) || '0');
  
  if (Date.now() - lastReminder > ONE_WEEK) {
    setTimeout(() => {
      showToast('💾 Ai făcut backup recent? Exportă datele din Setări ca să nu le pierzi!', 'warning');
      localStorage.setItem(BACKUP_KEY, String(Date.now()));
    }, 5000); // Show after 5s to not stack with sync toast
  }
})();
