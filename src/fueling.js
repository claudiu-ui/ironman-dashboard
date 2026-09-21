export function renderFuelingPage() {
  const page = document.createElement('div');
  page.className = 'page animate-in';
  
  page.innerHTML = `
    <div class="page-body">
      <div class="card animate-in" style="margin-bottom: var(--space-lg);">
        <div class="card-header">
          <div class="card-title">🚀 Race Fueling & Hydration Calculator</div>
          <div class="card-badge">IRONMAN Pro Strategy</div>
        </div>
        <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-md);">
          Setează detaliile cursei/sesiunii lungi pentru a genera planul științific de nutriție.
          Recomandările sunt bazate pe o greutate de ~95kg și toleranță ridicată la carbohidrați (90-120g/h).
        </p>
        
        <form id="fueling-form" class="grid-2" style="gap: var(--space-md);">
          <div class="form-group">
            <label class="form-label">Timp Estimat (ore)</label>
            <input type="number" class="form-input" id="race-hours" value="12" step="0.5" required />
          </div>
          <div class="form-group">
            <label class="form-label">Temperatură / Umiditate</label>
            <select class="form-input" id="race-temp">
              <option value="cold">Sub 15°C (Rece)</option>
              <option value="moderate" selected>15°C - 25°C (Moderat)</option>
              <option value="hot">Peste 25°C sau Umiditate Mare</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Strategie Carbohidrați (g/oră)</label>
            <select class="form-input" id="race-carbs">
              <option value="60">Conservator (60g/h)</option>
              <option value="90" selected>Optim (90g/h) - STANDARD PRO</option>
              <option value="120">Agresiv (120g/h) - Doar testat în antrenament</option>
            </select>
          </div>
          <div class="form-group" style="display: flex; align-items: flex-end;">
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Generează Plan</button>
          </div>
        </form>
      </div>

      <div id="fueling-results" style="display: none;">
        <h2 style="font-size: 18px; margin-bottom: var(--space-md);">Raport Nutriție Totală</h2>
        
        <div class="grid-3" style="margin-bottom: var(--space-lg);">
          <div class="stat-card" style="border: 1px solid rgba(59, 130, 246, 0.3);">
            <div class="stat-label">Carbohidrați Total</div>
            <div class="stat-value" id="tot-carbs" style="color: #3b82f6;">--</div>
            <div class="stat-subtext">grame</div>
          </div>
          <div class="stat-card" style="border: 1px solid rgba(16, 185, 129, 0.3);">
            <div class="stat-label">Lichide Total</div>
            <div class="stat-value" id="tot-fluid" style="color: #10b981;">--</div>
            <div class="stat-subtext">litri</div>
          </div>
          <div class="stat-card" style="border: 1px solid rgba(245, 158, 11, 0.3);">
            <div class="stat-label">Sodiu Total</div>
            <div class="stat-value" id="tot-sodium" style="color: #f59e0b;">--</div>
            <div class="stat-subtext">mg</div>
          </div>
        </div>

        <div class="grid-1-2" style="margin-bottom: var(--space-lg);">
          <!-- Bike Strategy -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🚴 Strategie Bicicletă (~55% din timp)</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: var(--text-secondary);">
              <div><strong style="color: var(--text-primary);">Aport pe oră:</strong> <span id="bike-hourly-carbs"></span></div>
              <div style="padding: 12px; background: rgba(59, 130, 246, 0.1); border-radius: 8px; color: #60a5fa;">
                <strong>Sugestie execuție:</strong>
                <ul style="margin-top: 8px; margin-left: 16px;">
                  <li>2 x Bidoane mari (750ml) cu mix de carbohidrați (aprox 90g per bidon).</li>
                  <li>Gel la fiecare 30 de minute (aprox 25-30g carbo/gel).</li>
                  <li>Bea 1-2 înghițituri de apă sau izotonic la fiecare 10-15 minute (alarma la ceas).</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Run Strategy -->
          <div class="card">
            <div class="card-header">
              <div class="card-title">🏃 Strategie Alergare (~35% din timp)</div>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px; font-size: 14px; color: var(--text-secondary);">
              <div><strong style="color: var(--text-primary);">Aport pe oră:</strong> <span id="run-hourly-carbs"></span></div>
              <div style="padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; color: #34d399;">
                <strong>Sugestie execuție:</strong>
                <ul style="margin-top: 8px; margin-left: 16px;">
                  <li>Viteza de digestie e mai mică! Concentrează-te pe surse lichide și geluri.</li>
                  <li>1 Gel (cu cofeină opțional la final) la fiecare 30-40 minute.</li>
                  <li>La fiecare aid station: Apă + Iso/Cola.</li>
                  <li>Pastile de sare dacă simți început de crampe.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  setTimeout(() => {
    const form = page.querySelector('#fueling-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const hours = parseFloat(page.querySelector('#race-hours').value);
      const carbsPerHour = parseInt(page.querySelector('#race-carbs').value);
      const temp = page.querySelector('#race-temp').value;

      // Hydration rates per hour based on temp (Litres)
      const fluidRates = {
        'cold': 0.5,
        'moderate': 0.75,
        'hot': 1.0 // or more depending on sweat rate
      };
      
      // Sodium rates per hour (mg)
      const sodiumRates = {
        'cold': 400,
        'moderate': 600,
        'hot': 900
      };

      const fluidPerHour = fluidRates[temp];
      const sodiumPerHour = sodiumRates[temp];

      const totalCarbs = hours * carbsPerHour;
      const totalFluid = hours * fluidPerHour;
      const totalSodium = hours * sodiumPerHour;

      // Update UI
      page.querySelector('#tot-carbs').textContent = Math.round(totalCarbs);
      page.querySelector('#tot-fluid').textContent = totalFluid.toFixed(1);
      page.querySelector('#tot-sodium').textContent = Math.round(totalSodium);

      page.querySelector('#bike-hourly-carbs').innerHTML = `
        ${carbsPerHour}g Carbo • ${fluidPerHour}L Lichide • ${sodiumPerHour}mg Sodiu
      `;
      page.querySelector('#run-hourly-carbs').innerHTML = `
        ${Math.max(60, carbsPerHour - 20)}g Carbo • ${fluidPerHour * 0.8}L Lichide (estimativ redus) • ${sodiumPerHour}mg Sodiu
      `;

      page.querySelector('#fueling-results').style.display = 'block';
      
      // Scroll to results
      page.querySelector('#fueling-results').scrollIntoView({ behavior: 'smooth' });
    });
  }, 0);

  return page;
}
