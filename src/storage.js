// ============================================
// LocalStorage Persistence Layer
// ============================================

const STORAGE_PREFIX = 'ironman_';

export const storage = {
  get(key, defaultValue = null) {
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      return raw ? JSON.parse(raw) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set(key, value) {
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage write failed:', e);
    }
  },

  remove(key) {
    localStorage.removeItem(STORAGE_PREFIX + key);
  },

  // Training log entries
  getWorkoutLog(date) {
    const logs = this.get('workouts', {});
    return logs[date] || null;
  },

  saveWorkout(date, workout) {
    const logs = this.get('workouts', {});
    if (!logs[date]) logs[date] = [];
    logs[date].push({ ...workout, id: Date.now(), createdAt: new Date().toISOString() });
    this.set('workouts', logs);

  // Auto-update gear distance if distance exists
    const dist = parseFloat(workout.distance);
    if (!isNaN(dist) && dist > 0 && workout.gearId) {
      this.addDistanceToGear(workout.gearId, dist);
    }
  },

  deleteWorkout(date, id) {
    const logs = this.get('workouts', {});
    if (logs[date]) {
      logs[date] = logs[date].filter(w => w.id !== id);
      if (logs[date].length === 0) delete logs[date];
      this.set('workouts', logs);
    }
  },

  // Gear Tracker
  getGear() {
    const defaultGear = [
      { id: 'g1', type: 'run', name: 'Asics Gel Nimbus 26 (Daily)', distance: 0, maxDistance: 600, active: true },
      { id: 'g2', type: 'run', name: 'Nike Alphafly 3 (Race/Carbon)', distance: 0, maxDistance: 300, active: true },
      { id: 'g3', type: 'bike', name: 'Tri Bike (ex: Cervelo P-Series)', distance: 0, maxDistance: 4000, active: true }
    ];
    return this.get('gear', defaultGear);
  },

  saveGear(gearArray) {
    this.set('gear', gearArray);
  },

  addDistanceToGear(gearId, distance) {
    const gear = this.getGear();
    let updated = false;
    for (let g of gear) {
      if (g.id === gearId) {
        g.distance = (g.distance || 0) + distance;
        updated = true;
      }
    }
    if (updated) {
      this.saveGear(gear);
    }
  },

  getWorkoutsForWeek(weekStartDate) {
    const logs = this.get('workouts', {});
    const results = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().split('T')[0];
      if (logs[key]) results[key] = logs[key];
    }
    return results;
  },

  // Daily logs (nutrition, sleep, weight, RPE, notes)
  getDailyLog(date) {
    const logs = this.get('daily', {});
    return logs[date] || { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0, sleep: 0, weight: 0, rpe: 0, notes: '' };
  },

  saveDailyLog(date, data) {
    const logs = this.get('daily', {});
    logs[date] = { ...logs[date], ...data, updatedAt: new Date().toISOString() };
    this.set('daily', logs);
  },

  // Benchmarks
  getBenchmarks() {
    return this.get('benchmarks', {});
  },

  toggleBenchmark(weekNum, testIndex) {
    const benchmarks = this.get('benchmarks', {});
    const key = `w${weekNum}_t${testIndex}`;
    benchmarks[key] = !benchmarks[key];
    this.set('benchmarks', benchmarks);
    return benchmarks[key];
  },

  // Equipment checklist
  getEquipment() {
    return this.get('equipment', {});
  },

  toggleEquipment(itemId) {
    const eq = this.get('equipment', {});
    eq[itemId] = !eq[itemId];
    this.set('equipment', eq);
    return eq[itemId];
  },

  // Gym log
  saveGymSession(date, sessionType, exercises) {
    const logs = this.get('gym', {});
    if (!logs[date]) logs[date] = {};
    logs[date][sessionType] = { exercises, completedAt: new Date().toISOString() };
    this.set('gym', logs);
  },

  getGymSession(date, sessionType) {
    const logs = this.get('gym', {});
    return logs[date]?.[sessionType] || null;
  },

  // Custom Gym Programs Editability
  getCustomGymPrograms(defaultPrograms) {
    const stored = this.get('customGymPrograms', null);
    if (!stored) return defaultPrograms;
    // Merge any missing programs from defaults (like newly added 'accesorii')
    const merged = { ...stored };
    for (const key in defaultPrograms) {
      if (!merged[key]) {
        merged[key] = defaultPrograms[key];
      }
    }
    return merged;
  },

  saveCustomGymPrograms(programs) {
    this.set('customGymPrograms', programs);
  },

  // Intervals.icu Settings
  getIntervalsSettings() {
    return this.get('intervalsSettings', { athleteId: '', apiKey: '' });
  },

  saveIntervalsSettings(settings) {
    this.set('intervalsSettings', settings);
  },

  // Custom Supplements Editability
  getCustomSupplements(defaultSupplements) {
    return this.get('customSupplements', defaultSupplements);
  },

  saveCustomSupplements(supplements) {
    this.set('customSupplements', supplements);
  },

  // Supplements tracking
  getSupplements(date) {
    const logs = this.get('supplements', {});
    return logs[date] || {};
  },

  toggleSupplement(date, name) {
    const logs = this.get('supplements', {});
    if (!logs[date]) logs[date] = {};
    logs[date][name] = !logs[date][name];
    this.set('supplements', logs);
    return logs[date][name];
  },

  // Gut training log
  getGutTraining() {
    return this.get('gutTraining', []);
  },

  addGutTrainingEntry(entry) {
    const logs = this.get('gutTraining', []);
    logs.push({ ...entry, id: Date.now(), createdAt: new Date().toISOString() });
    this.set('gutTraining', logs);
  },

  // ------------------------------------------
  // Niggles / Injury Tracker
  // ------------------------------------------
  getNiggles() {
    return this.get('niggles', []);
  },

  addNiggle(niggle) {
    const list = this.get('niggles', []);
    list.push({ ...niggle, id: Date.now(), createdAt: new Date().toISOString() });
    this.set('niggles', list);
  },

  deleteNiggle(id) {
    let list = this.get('niggles', []);
    list = list.filter(n => n.id !== id);
    this.set('niggles', list);
  },

  updateNiggle(id, updates) {
    let list = this.get('niggles', []);
    const idx = list.findIndex(n => n.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...updates, updatedAt: new Date().toISOString() };
      this.set('niggles', list);
    }
  },

  // Export all data
  exportAll() {
    const data = {};
    const legacyKeys = ['workouts', 'gear', 'daily', 'benchmarks', 'equipment', 'gym', 'customGymPrograms', 'intervalsSettings', 'customSupplements', 'supplements', 'gutTraining', 'niggles', 'week_schedule_1', 'week_schedule_2', 'week_schedule_3', 'week_schedule_4', 'week_schedule_5', 'week_schedule_6', 'week_schedule_7', 'week_schedule_8', 'week_schedule_9', 'week_schedule_10'];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(STORAGE_PREFIX)) {
        data[key.replace(STORAGE_PREFIX, '')] = JSON.parse(localStorage.getItem(key));
      } else if (legacyKeys.includes(key) || key.startsWith('week_schedule_')) {
        data[key] = JSON.parse(localStorage.getItem(key));
      }
    }
    return data;
  },

  // Import data
  importAll(data) {
    Object.entries(data).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
};
