// ============================================
// Settings Page — Integrations & Config
// ============================================

import { storage } from './storage.js';

export function renderSettingsPage() {
  const page = document.createElement('div');
  page.className = 'settings-page';

  const settings = storage.getIntervalsSettings();

  page.innerHTML = `
    <div class="page-body">
      <div class="card animate-in">
        <div class="card-header" style="cursor: pointer; justify-content: space-between; display: flex;" onclick="document.getElementById('intervals-setup-content').style.display = document.getElementById('intervals-setup-content').style.display === 'none' ? 'block' : 'none'; document.getElementById('intervals-setup-toggle').textContent = document.getElementById('intervals-setup-content').style.display === 'none' ? '▼' : '▲';">
          <div class="card-title">⚙️ Integrare Intervals.icu (Sincronizare Coros)</div>
          <span id="intervals-setup-toggle" style="color: var(--text-tertiary); font-size: 12px; align-self: center;">▼</span>
        </div>
        
        <div id="intervals-setup-content" style="display: none;">
          <div style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-lg); margin-top: var(--space-md);">
            <p>Pentru a sincroniza automat antrenamentele efectuate cu ceasul Coros, trebuie să le preluăm prin Intervals.icu.</p>
          <ol style="margin-top: 10px; padding-left: 20px; display: flex; flex-direction: column; gap: 8px;">
            <li>Asigură-te că ceasul Coros este conectat la contul tău de Intervals.icu (Settings → Connections).</li>
            <li>Mergi pe <a href="https://intervals.icu/settings" target="_blank" rel="noopener noreferrer">Intervals.icu Settings</a>.</li>
            <li>Caută secțiunea <strong>API Access</strong> (în partea de jos).</li>
            <li>Copiază <strong>Athlete ID</strong> (ex: i123456) și creează o cheie nouă (<strong>API Key</strong>).</li>
          </ol>
        </div>

        <div class="grid-2" style="margin-bottom: var(--space-lg)">
          <div class="form-group">
            <label class="form-label">Athlete ID</label>
            <input type="text" class="form-input" id="intervals-id" value="${settings.athleteId || ''}" placeholder="ex: i123456" />
          </div>
          <div class="form-group">
            <label class="form-label">API Key</label>
            <input type="password" class="form-input" id="intervals-key" value="${settings.apiKey || ''}" placeholder="****************" />
          </div>
        </div>

        <div style="display: flex; gap: var(--space-md); align-items: center;">
          <button class="btn btn-primary" id="save-settings-btn">💾 Salvează Setările</button>
          <button class="btn btn-ghost" id="sync-intervals-btn" ${!settings.athleteId || !settings.apiKey ? 'disabled' : ''}>
            🔄 Sincronizează Acum
          </button>
        </div>
      </div>
      </div>


      <!-- Sync Results -->
      <div class="card animate-in animate-in-delay-2" style="margin-top: var(--space-lg);" id="sync-results-card">
        <div class="card-header" style="cursor: pointer; justify-content: space-between; display: flex;" onclick="document.getElementById('sync-results-content').style.display = document.getElementById('sync-results-content').style.display === 'none' ? 'block' : 'none'; document.getElementById('sync-results-toggle').textContent = document.getElementById('sync-results-content').style.display === 'none' ? '▼' : '▲';">
          <div class="card-title">📋 Antrenamente Sincronizate Recent</div>
          <span id="sync-results-toggle" style="color: var(--text-tertiary); font-size: 12px; align-self: center;">▼</span>
        </div>
        <div id="sync-results-content" style="display: none;">
          <div id="sync-results-list" style="max-height: 400px; overflow-y: auto;">
            ${renderRecentWorkouts()}
          </div>
        </div>
      </div>
    </div>

  `;

  setTimeout(() => {
    const saveBtn = page.querySelector('#save-settings-btn');
    const syncBtn = page.querySelector('#sync-intervals-btn');
    const statusText = page.querySelector('#sync-status');

    saveBtn.addEventListener('click', () => {
      const athleteId = page.querySelector('#intervals-id').value.trim();
      const apiKey = page.querySelector('#intervals-key').value.trim();
      storage.saveIntervalsSettings({ athleteId, apiKey });
      
      saveBtn.textContent = '✓ Salvat';
      saveBtn.style.background = 'var(--success)';
      setTimeout(() => {
        saveBtn.textContent = '💾 Salvează Setările';
        saveBtn.style.background = '';
      }, 2000);

      syncBtn.disabled = !(athleteId && apiKey);
    });

    syncBtn.addEventListener('click', async () => {
      const { athleteId, apiKey } = storage.getIntervalsSettings();
      if (!athleteId || !apiKey) return;

      syncBtn.disabled = true;
      syncBtn.textContent = '⏳ Se sincronizează...';
      statusText.textContent = '';

      try {
        const count = await syncIntervalsWorkouts(athleteId, apiKey);
        statusText.textContent = `✅ ${count} activități sincronizate!`;
        statusText.style.color = 'var(--success)';
        // Re-render recent workouts
        const resultsList = page.querySelector('#sync-results-list');
        if (resultsList) resultsList.innerHTML = renderRecentWorkouts();
      } catch (err) {
        statusText.textContent = '❌ Eroare: ' + err.message;
        statusText.style.color = 'var(--danger)';
      } finally {
        syncBtn.disabled = false;
        syncBtn.textContent = '🔄 Sincronizează Acum';
      }
    });
  }, 0);

  return page;
}


function renderRecentWorkouts() {
  const allWorkouts = storage.get('workouts', {});
  const dates = Object.keys(allWorkouts).sort().reverse().slice(0, 14); // Last 14 days
  
  if (dates.length === 0) {
    return '<p style="color: var(--text-tertiary); font-size: 13px; padding: var(--space-md);">Nu există antrenamente logate încă. Sincronizează din Coros sau adaugă manual.</p>';
  }

  const typeIcons = { swim: '🏊', run: '🏃', bike: '🚴', gym: '🏋️', conditioning: '💪', other: '🏅' };
  const typeColors = { swim: 'var(--swim)', run: 'var(--run)', bike: 'var(--bike)', gym: 'var(--gym)', conditioning: 'var(--conditioning)', other: 'var(--text-secondary)' };

  return dates.map(date => {
    const logs = allWorkouts[date];
    return logs.map(log => {
      const dist = parseFloat(log.distance) || 0;
      const dur = parseInt(log.duration) || 0;
      const hr = parseInt(log.hr) || 0;
      const pace = (dist > 0 && dur > 0 && log.type === 'run') 
        ? `${Math.floor(dur / dist)}:${String(Math.round((dur / dist % 1) * 60)).padStart(2, '0')}/km` 
        : null;
      const speed = (dist > 0 && dur > 0 && log.type === 'bike')
        ? `${(dist / (dur / 60)).toFixed(1)} km/h`
        : null;
      const cadence = log.cadence ? `${log.cadence} ${log.type === 'run' ? 'spm' : 'rpm'}` : null;
      const calories = log.calories ? `${log.calories} kcal` : null;
      const elevation = log.elevation ? `${log.elevation}m ↑` : null;

      return `
        <div style="display: flex; align-items: center; gap: var(--space-md); padding: 10px var(--space-md); border-bottom: 1px solid var(--border-subtle); font-size: 13px;">
          <span style="font-size: 18px;">${typeIcons[log.type] || '🏅'}</span>
          <div style="flex: 1;">
            <div style="font-weight: 600; color: ${typeColors[log.type] || 'inherit'};">${log.notes || log.type}</div>
            <div style="font-size: 11px; color: var(--text-tertiary);">${date}</div>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: flex-end;">
            ${dist > 0 ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">${dist.toFixed(1)} km</span>` : ''}
            ${dur > 0 ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">${dur} min</span>` : ''}
            ${hr > 0 ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">❤️ ${hr}</span>` : ''}
            ${pace ? `<span style="font-family: var(--font-mono); font-size: 11px; background: rgba(249,115,22,0.1); padding: 2px 8px; border-radius: var(--radius-sm); color: var(--run);">${pace}</span>` : ''}
            ${speed ? `<span style="font-family: var(--font-mono); font-size: 11px; background: rgba(34,197,94,0.1); padding: 2px 8px; border-radius: var(--radius-sm); color: var(--bike);">${speed}</span>` : ''}
            ${cadence ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">🦶 ${cadence}</span>` : ''}
            ${calories ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">🔥 ${calories}</span>` : ''}
            ${elevation ? `<span style="font-family: var(--font-mono); font-size: 11px; background: var(--bg-glass); padding: 2px 8px; border-radius: var(--radius-sm);">⛰️ ${elevation}</span>` : ''}
          </div>
        </div>
      `;
    }).join('');
  }).join('');
}

// Full sync — extracts ALL relevant metrics
export async function syncIntervalsWorkouts(athleteId, apiKey) {
  const oldest = new Date();
  oldest.setDate(oldest.getDate() - 60); // Last 60 days
  const oldestIso = oldest.toISOString().split('T')[0];
  const newestIso = new Date().toISOString().split('T')[0];

  const url = `https://intervals.icu/api/v1/athlete/${athleteId}/activities?oldest=${oldestIso}&newest=${newestIso}`;
  
  const headers = new Headers();
  headers.set('Authorization', 'Basic ' + btoa('API_KEY:' + apiKey));

  const response = await fetch(url, { headers });
  
  if (!response.ok) {
    throw new Error('Eroare autentificare / API');
  }

  const activities = await response.json();
  let syncCount = 0;
  
  activities.forEach(activity => {
    if (!activity.start_date_local) return;
    
    const date = activity.start_date_local.split('T')[0];
    let type = 'other';
    
    const t = (activity.type || '').toLowerCase();
    if (t.includes('run')) type = 'run';
    else if (t.includes('ride') || t.includes('bike') || t.includes('virtualride')) type = 'bike';
    else if (t.includes('swim')) type = 'swim';
    else if (t.includes('weight') || t.includes('strength')) type = 'gym';

    // Extract ALL relevant metrics
    const workout = {
      type: type,
      distance: activity.distance ? (activity.distance / 1000).toFixed(2) : 0,
      duration: activity.moving_time ? Math.round(activity.moving_time / 60) : 0,
      hr: activity.average_heartrate ? Math.round(activity.average_heartrate) : 0,
      hrMax: activity.max_heartrate ? Math.round(activity.max_heartrate) : 0,
      rpe: activity.rpe || 0,
      cadence: activity.average_cadence ? Math.round(activity.average_cadence) : 0,
      calories: activity.calories ? Math.round(activity.calories) : 0,
      elevation: activity.total_elevation_gain ? Math.round(activity.total_elevation_gain) : 0,
      power: activity.average_watts ? Math.round(activity.average_watts) : 0,
      pace: null, // Calculated below
      speed: null, // Calculated below  
      notes: activity.name || '',
      source: 'intervals',
      intervalsId: activity.id || ''
    };

    // Calculate pace (for run) or speed (for bike)
    const distKm = parseFloat(workout.distance);
    const durMin = workout.duration;
    if (distKm > 0 && durMin > 0) {
      if (type === 'run') {
        const paceMinPerKm = durMin / distKm;
        const paceMin = Math.floor(paceMinPerKm);
        const paceSec = Math.round((paceMinPerKm - paceMin) * 60);
        workout.pace = `${paceMin}:${String(paceSec).padStart(2, '0')}/km`;
      } else if (type === 'bike') {
        workout.speed = (distKm / (durMin / 60)).toFixed(1);
      }
    }

    // Check for duplicates
    const existingLogs = storage.getWorkoutLog(date) || [];
    const isDuplicate = existingLogs.some(log => 
      log.source === 'intervals' && log.intervalsId === workout.intervalsId
    );
    
    // Fallback duplicate check by name+duration
    const isDuplicateFallback = !workout.intervalsId && existingLogs.some(log => 
      log.source === 'intervals' && log.notes === workout.notes && log.duration === workout.duration
    );
    
    if (!isDuplicate && !isDuplicateFallback) {
      storage.saveWorkout(date, workout);
      syncCount++;
    }
  });

  return syncCount;
}
