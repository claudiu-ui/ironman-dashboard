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
      { id: 'g1', type: 'run', name: 'Asics Gel Nimbus 26 (Daily)', baseDistance: 0, maxDistance: 600, active: true },
      { id: 'g2', type: 'run', name: 'Nike Alphafly 3 (Race/Carbon)', baseDistance: 0, maxDistance: 300, active: true },
      { id: 'g3', type: 'bike', name: 'Tri Bike (ex: Cervelo P-Series)', baseDistance: 0, maxDistance: 4000, active: true }
    ];
    let gearList = this.get('gear', defaultGear);
    
    // Auto-calculate actual distance based on logged workouts
    const allWorkouts = this.get('workouts', {});
    const workoutDistances = {};
    Object.values(allWorkouts).forEach(dayLogs => {
      dayLogs.forEach(w => {
        if (w.gearId && !w.isSkipped && parseFloat(w.distance) > 0) {
          workoutDistances[w.gearId] = (workoutDistances[w.gearId] || 0) + parseFloat(w.distance);
        }
      });
    });

    gearList = gearList.map(g => {
      const loggedDist = workoutDistances[g.id] || 0;
      
      // Migrate legacy 'distance' to 'baseDistance'
      if (g.baseDistance === undefined) {
          g.baseDistance = Math.max(0, (g.distance || 0) - loggedDist);
      }

      g.distance = g.baseDistance + loggedDist;
      return g;
    });

    return gearList;
  },

  saveGear(gearArray) {
    this.set('gear', gearArray);
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

  // Race Day Checklist
  getRaceChecklist() {
    return this.get('raceChecklist', {});
  },

  toggleRaceChecklist(itemId) {
    const list = this.get('raceChecklist', {});
    list[itemId] = !list[itemId];
    this.set('raceChecklist', list);
    return list[itemId];
  },

  // Apple Health Sync via Google Apps Script
  async syncAppleHealth() {
    try {
      const url = 'https://script.google.com/macros/s/AKfycbxrFVu67PQUWJBucjasRk4P3KeOiNrddB0MpB90w8zXhAsEo3UeyVtCkN8GX2slVYjM/exec';
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json(); // Array of arrays

      const logs = this.get('workouts', {});
      let updated = false;

      // 1. Remove all previous apple_health syncs to avoid duplicates
      Object.keys(logs).forEach(date => {
        logs[date] = logs[date].filter(w => w.source !== 'apple_health');
        if (logs[date].length === 0) delete logs[date];
      });

      // 2. Parse new ones
      data.forEach(row => {
        if (!row || row.length < 2) return;
        
        let dateStr = row[0];
        // Convert JS date string from Google Sheets to YYYY-MM-DD
        if (dateStr instanceof Date || typeof dateStr === 'string') {
           try {
             const d = new Date(dateStr);
             if (isNaN(d.getTime())) return; // Skip headers
             dateStr = d.toISOString().split('T')[0];
           } catch {
             return;
           }
        }
        
        const duration = parseFloat(row[1]) || 0;
        const calories = parseFloat(row[2]) || 0;
        const hr = parseFloat(row[3]) || 0;

        if (duration > 0) {
          if (!logs[dateStr]) logs[dateStr] = [];
          
          logs[dateStr].push({
            id: 'ah_' + Date.now() + Math.random(),
            type: 'gym',
            duration: duration,
            calories: calories,
            hr: hr,
            notes: 'Importat automat din Apple Health 🍎',
            source: 'apple_health',
            createdAt: new Date().toISOString()
          });
          updated = true;
        }
      });

      if (updated) {
        this.set('workouts', logs);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to sync Apple Health:', error);
      return false;
    }
  },

  // Export all data
  exportAll() {
    const data = {};
    const legacyKeys = ['workouts', 'gear', 'daily', 'benchmarks', 'equipment', 'gym', 'customGymPrograms', 'intervalsSettings', 'customSupplements', 'supplements', 'gutTraining', 'niggles', 'raceChecklist', 'week_schedule_1', 'week_schedule_2', 'week_schedule_3', 'week_schedule_4', 'week_schedule_5', 'week_schedule_6', 'week_schedule_7', 'week_schedule_8', 'week_schedule_9', 'week_schedule_10'];

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
