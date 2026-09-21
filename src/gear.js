import { storage } from './storage.js';

export function renderGearPage() {
  const page = document.createElement('div');
  page.className = 'page animate-in';

  let gearList = storage.getGear();

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
        distance: parseFloat(page.querySelector('#gear-dist').value) || 0,
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
