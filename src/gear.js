import { storage } from './storage.js';

export function renderGearPage() {
  const page = document.createElement('div');
  page.className = 'page animate-in';

  let gearList = storage.getGear();

  // Auto-sync: Assign unassigned workouts to active gear
  const allWorkouts = storage.get('workouts', {});
  let didUpdate = false;
  
  Object.keys(allWorkouts).forEach(date => {
    allWorkouts[date].forEach(w => {
      if (!w.gearId && parseFloat(w.distance) > 0) {
        const activeGear = gearList.filter(g => g.type === w.type && g.active);
        if (activeGear.length > 0) {
          const targetGear = activeGear[0];
          w.gearId = targetGear.id;
          didUpdate = true;
        }
      }
    });
  });
  
  if (didUpdate) {
    storage.set('workouts', allWorkouts);
    gearList = storage.getGear(); // Refresh with dynamic recalculation
  }

  const renderGearCards = () => {
    return gearList.map(g => {
      const pct = Math.min(100, Math.round((g.distance / g.maxDistance) * 100));
      const statusColor = pct > 90 ? 'var(--danger)' : pct > 75 ? 'var(--warning)' : 'var(--success)';
      const icon = g.type === 'run' ? '👟' : g.type === 'bike' ? '🚴' : '🏊';
      
      return `
        <div class="card" style="margin-bottom: var(--space-md);">
          <div class="card-header">
            <div class="card-title">${icon} ${g.name}</div>
            <div class="card-badge" style="background: ${g.active ? 'var(--bg-glass)' : 'rgba(239, 68, 68, 0.1)'}; color: ${g.active ? 'var(--text-secondary)' : 'var(--danger)'}">
              ${g.active ? 'Activ' : 'Retras'}
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: var(--space-sm);">
            <div style="font-size: 24px; font-weight: 700; color: var(--text-primary);">
              ${g.distance.toFixed(1)} <span style="font-size: 14px; color: var(--text-tertiary); font-weight: 400;">km</span>
            </div>
            <div style="font-size: 12px; color: var(--text-tertiary);">
              Max: ${g.maxDistance} km
            </div>
          </div>
          <div class="phase-bar-container" style="margin-bottom: var(--space-md);">
            <div class="phase-bar" style="background: var(--bg-input);">
              <div class="phase-bar-fill" style="width: ${pct}%; background: ${statusColor}"></div>
            </div>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-ghost btn-sm gear-edit-dist-btn" data-id="${g.id}">
              ✏️ Editează
            </button>
            <button type="button" class="btn btn-ghost btn-sm gear-toggle-btn" data-id="${g.id}">
              ${g.active ? '🗑️ Retrage' : '✅ Activează'}
            </button>
            <button type="button" class="btn btn-ghost btn-sm gear-delete-btn" data-id="${g.id}" style="color: var(--danger); border-color: rgba(239, 68, 68, 0.3);">
              Șterge Definitiv
            </button>
          </div>
        </div>
      `;
    }).join('');
  };

  page.innerHTML = `
    <div class="grid-1-2">
      <!-- Left: Add New Gear -->
      <div>
        <div class="card animate-in">
          <div class="card-header">
            <div class="card-title">➕ Adaugă Echipament</div>
          </div>
          <form id="add-gear-form">
            <div class="form-group">
              <label class="form-label">Tip</label>
              <select class="form-input" id="gear-type">
                <option value="run">👟 Alergare (Adidași)</option>
                <option value="bike">🚴 Bicicletă</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Nume / Model</label>
              <input type="text" class="form-input" id="gear-name" placeholder="ex: Hoka Mach 6" required />
            </div>
            <div class="form-group">
              <label class="form-label">Distanță curentă (km)</label>
              <input type="number" class="form-input" id="gear-dist" value="0" step="0.1" required />
            </div>
            <div class="form-group">
              <label class="form-label">Limită uzură (km)</label>
              <input type="number" class="form-input" id="gear-max" value="600" required />
            </div>
            <button type="submit" class="btn btn-primary" style="width: 100%; justify-content: center;">Adaugă în Tracker</button>
          </form>
        </div>
      </div>

      <!-- Right: Gear List -->
      <div>
        <div class="card animate-in animate-in-delay-1" style="background: transparent; border: none; padding: 0;">
          <h2 style="font-size: 16px; margin-bottom: var(--space-md); color: var(--text-secondary);">Garaj & Echipament Activ</h2>
          <div id="gear-list-container">
            ${renderGearCards()}
          </div>
        </div>
    </div>
    
    <!-- Timeline Achizitii -->
    <div class="card animate-in animate-in-delay-2" style="margin-top: var(--space-lg);">
      <div class="card-header">
        <div class="card-title">📈 Road to IRONMAN: Ghid de Achiziții Echipament</div>
        <div class="card-badge" style="background: var(--bg-glass); color: var(--text-secondary);">Planificare Financiară</div>
      </div>
      <p style="color: var(--text-secondary); font-size: 14px; margin-bottom: var(--space-lg);">
        Un IRONMAN necesită o mulțime de echipamente, dar NU ai nevoie de toate în prima zi. Iată o progresie logică a investițiilor pentru a-ți eșalona costurile de-a lungul celor 48 de săptămâni.
      </p>

      <div style="display: flex; flex-direction: column; gap: 16px;">
        <!-- Phase 1 -->
        <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #3b82f6; padding: 16px; border-radius: 0 8px 8px 0;">
          <h4 style="color: #3b82f6; font-size: 15px; margin-bottom: 8px;">Faza 1: Fundație (Lunile 1-3)</h4>
          <p style="color: var(--text-tertiary); font-size: 13px; margin-bottom: 12px;">Concentrează-te pe construirea unui obicei solid. Echipament de bază.</p>
          <ul style="color: var(--text-secondary); font-size: 13px; margin-left: 20px; line-height: 1.6;">
            <li><strong>Alergare:</strong> O pereche bună de adidași "Daily Trainer" (ex: Asics Nimbus, Hoka Clifton). Acoperă grosul kilometrilor.</li>
            <li><strong>Înot:</strong> Slip/costum de antrenament, ochelari de înot confortabili, cască.</li>
            <li><strong>Ciclism:</strong> Bicicletă (cursieră sau gravel cu cauciucuri de șosea), cască de protecție obligatorie, pantaloni cu bazon.</li>
            <li><strong>Tehnologie:</strong> Ceas GPS multisport (Coros/Garmin) și centură HR (opțional, dar recomandat).</li>
          </ul>
        </div>

        <!-- Phase 2 -->
        <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #10b981; padding: 16px; border-radius: 0 8px 8px 0;">
          <h4 style="color: #10b981; font-size: 15px; margin-bottom: 8px;">Faza 2: Construcție (Lunile 4-6)</h4>
          <p style="color: var(--text-tertiary); font-size: 13px; margin-bottom: 12px;">Antrenamentele devin specifice. Ai nevoie de echipament de tranziție.</p>
          <ul style="color: var(--text-secondary); font-size: 13px; margin-left: 20px; line-height: 1.6;">
            <li><strong>Ciclism:</strong> Pedale clipless (automate) și pantofi de ciclism. Vor crește enorm eficiența pe bicicletă.</li>
            <li><strong>Înot:</strong> Wetsuit (Neopren) de triatlon pentru antrenamente în ape deschise (dacă apa e sub 22 grade).</li>
            <li><strong>Nutriție:</strong> Bidoane suplimentare pentru bicicletă, primele comenzi de geluri/izotonic (Maurten, SiS, Precision) pentru a testa toleranța.</li>
          </ul>
        </div>

        <!-- Phase 3 -->
        <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0;">
          <h4 style="color: #f59e0b; font-size: 15px; margin-bottom: 8px;">Faza 3: Specificitate / Vârf (Lunile 7-9)</h4>
          <p style="color: var(--text-tertiary); font-size: 13px; margin-bottom: 12px;">Se apropie cursele de simulare și long ride-urile de +150km.</p>
          <ul style="color: var(--text-secondary); font-size: 13px; margin-left: 20px; line-height: 1.6;">
            <li><strong>Ciclism:</strong> Aerobars (Clip-on) adăugate pe cursieră SAU trecerea la bicicletă de Triatlon (TT). Bike fitting profesional obligatoriu.</li>
            <li><strong>Alergare:</strong> O a doua pereche de adidași (de viteză/cursă) pe care să-i rodezi (ex: pantofi cu placă de carbon).</li>
            <li><strong>Echipament cursă:</strong> Costum de triatlon (Trisuit - dintr-o singură piesă), centură port-număr.</li>
          </ul>
        </div>

        <!-- Phase 4 -->
        <div style="background: rgba(255,255,255,0.02); border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0;">
          <h4 style="color: #ef4444; font-size: 15px; margin-bottom: 8px;">Faza 4: Taper & Race Day (Lună 10-12)</h4>
          <p style="color: var(--text-tertiary); font-size: 13px; margin-bottom: 12px;">Ultimele retușuri. Nu se mai cumpără echipament nou care necesită rodaj.</p>
          <ul style="color: var(--text-secondary); font-size: 13px; margin-left: 20px; line-height: 1.6;">
            <li><strong>Kit reparație:</strong> CO2, leviere, cameră de rezervă (exersată schimbarea).</li>
            <li><strong>Marginal Gains:</strong> Cască Aero de contratimp, șosete aero (opțional, dacă bugetul permite).</li>
            <li><strong>Nutriție Cursă:</strong> Stocul final de geluri pentru Race Day.</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // Attach Events
  setTimeout(() => {
    const form = page.querySelector('#add-gear-form');
    const listContainer = page.querySelector('#gear-list-container');

    const attachListEvents = () => {
      page.querySelectorAll('.gear-toggle-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = e.currentTarget.dataset.id;
          const item = gearList.find(g => g.id === id);
          if (item) {
            item.active = !item.active;
            storage.saveGear(gearList);
            listContainer.innerHTML = renderGearCards();
            attachListEvents();
          }
        });
      });

      page.querySelectorAll('.gear-edit-dist-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const id = e.currentTarget.dataset.id;
          const item = gearList.find(g => g.id === id);
          if (item) {
            const newDist = prompt(`Editează distanța curentă pentru ${item.name} (km):`, item.distance.toFixed(1));
            if (newDist !== null) {
              const parsed = parseFloat(newDist);
              if (!isNaN(parsed) && parsed >= 0) {
                const allWorkouts = storage.get('workouts', {});
                let loggedDist = 0;
                Object.values(allWorkouts).forEach(dayLogs => dayLogs.forEach(w => {
                   if (w.gearId === item.id && !w.isSkipped && parseFloat(w.distance) > 0) {
                     loggedDist += parseFloat(w.distance);
                   }
                }));
                item.baseDistance = Math.max(0, parsed - loggedDist);
                storage.saveGear(gearList);
                listContainer.innerHTML = renderGearCards();
                attachListEvents();
              }
            }
          }
        });
      });

      page.querySelectorAll('.gear-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          const currentText = btn.textContent.trim();
          if (currentText === 'Șterge Definitiv') {
            btn.textContent = 'Ești sigur?';
            btn.style.background = 'var(--danger)';
            btn.style.color = 'white';
            setTimeout(() => {
              if (btn.textContent === 'Ești sigur?') {
                btn.textContent = 'Șterge Definitiv';
                btn.style.background = 'transparent';
                btn.style.color = 'var(--danger)';
              }
            }, 3000);
          } else if (currentText === 'Ești sigur?') {
            const id = e.currentTarget.dataset.id;
            gearList = gearList.filter(g => g.id !== id);
            storage.saveGear(gearList);
            listContainer.innerHTML = renderGearCards();
            attachListEvents();
          }
        });
      });
    };

    attachListEvents();

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const newGear = {
        id: 'g' + Date.now(),
        type: page.querySelector('#gear-type').value,
        name: page.querySelector('#gear-name').value,
        baseDistance: parseFloat(page.querySelector('#gear-dist').value) || 0,
        maxDistance: parseFloat(page.querySelector('#gear-max').value) || 600,
        active: true
      };
      
      gearList.push(newGear);
      storage.saveGear(gearList);
      
      listContainer.innerHTML = renderGearCards();
      attachListEvents();
      form.reset();
      page.querySelector('#gear-type').value = 'run';
      page.querySelector('#gear-dist').value = '0';
      page.querySelector('#gear-max').value = '600';
    });
  }, 0);

  return page;
}
