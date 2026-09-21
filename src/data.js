// ============================================
// IRONMAN TRAINING PLAN — Complete Data
// 48 Weeks: Sept 2026 → Aug 2027
// ============================================

// Plan start date (Monday of Week 1)
export const PLAN_START = new Date('2026-08-31'); // Set for Week 3 currently
export const RACE_DATE = new Date('2027-08-29');

export const ATHLETE = {
  name: 'Claudiu Iordache',
  age: 26,
  weight: 95,
  hrMax: 194,
  semiMarathon: '1:48',
  pace10k: '5:00-5:30/km',
  watch: 'COROS PACE 3',
  bike: 'Pinnacle (endurance/gravel)',
  pool: '25m',
};

export const HR_ZONES = [
  { zone: 1, name: 'Recovery', pctMin: 50, pctMax: 60, bpmMin: 97, bpmMax: 116, feel: 'Plimbare, zero efort' },
  { zone: 2, name: 'Aerobic', pctMin: 60, pctMax: 70, bpmMin: 116, bpmMax: 136, feel: 'Poți vorbi în propoziții complete' },
  { zone: 3, name: 'Tempo', pctMin: 70, pctMax: 80, bpmMin: 136, bpmMax: 155, feel: 'Poți spune 3-4 cuvinte' },
  { zone: 4, name: 'Threshold', pctMin: 80, pctMax: 90, bpmMin: 155, bpmMax: 175, feel: 'Greu de vorbit, efort mare' },
  { zone: 5, name: 'Max', pctMin: 90, pctMax: 100, bpmMin: 175, bpmMax: 194, feel: 'Tot ce ai, nu poți vorbi' },
];

export const PHASES = [
  { id: 'foundation', name: 'Fundație', weeks: [1, 16], color: '#06b6d4', icon: '🏗️', description: 'Baza aerobă, tehnica crawl, obișnuirea cu volumul' },
  { id: 'build', name: 'Build', weeks: [17, 32], color: '#f97316', icon: '📈', description: 'Intensitate crescută, Brick workouts, nutriție pe bicicletă' },
  { id: 'peak', name: 'Peak', weeks: [33, 44], color: '#ef4444', icon: '🔥', description: 'Volum maxim, simulări de cursă, nutriție Race Day' },
  { id: 'taper', name: 'Taper', weeks: [45, 48], color: '#22c55e', icon: '🎯', description: 'Ajungi la start proaspăt și odihnit' },
];

export function getCurrentPhase(weekNum) {
  return PHASES.find(p => weekNum >= p.weeks[0] && weekNum <= p.weeks[1]) || PHASES[0];
}

export function getCurrentWeek() {
  const now = new Date();
  const diff = now - PLAN_START;
  const weekNum = Math.floor(diff / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.max(1, Math.min(48, weekNum));
}

export function getDaysUntilRace() {
  const now = new Date();
  const diff = RACE_DATE - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function isDeloadWeek(weekNum) {
  return weekNum % 4 === 0;
}

// Weekly template for current layout
export const WEEKLY_TEMPLATE_PHASE1 = [
  {
    day: 'Luni', sessions: [
      { time: '08:00', type: 'swim', title: 'Înot', detail: 'Tehnica Crawl', icon: '🏊' },
      { time: '20:00', type: 'gym', title: 'Lower', detail: 'Picioare (unica zi)', icon: '🏋️' },
    ]
  },
  {
    day: 'Marți', sessions: [
      { time: '08:00', type: 'run', title: 'Easy Run', detail: 'Z2, conversațional', icon: '🏃' },
      { time: '20:00', type: 'gym', title: 'Upper 1', detail: 'Push Focus', icon: '🏋️' },
    ]
  },
  {
    day: 'Miercuri', sessions: [
      { time: '08:00', type: 'swim', title: 'Înot', detail: 'Drill-uri + Rezistență', icon: '🏊' },
      { time: '20:00', type: 'conditioning', title: 'Conditioning', detail: 'Hyrox Style', icon: '💪' },
    ]
  },
  {
    day: 'Joi', sessions: [
      { time: '08:00', type: 'bike', title: 'Easy Bike', detail: 'Z2, cadență 80-90 RPM', icon: '🚴' },
      { time: '20:00', type: 'gym', title: 'Upper 2', detail: 'Pull Focus', icon: '🏋️' },
    ]
  },
  {
    day: 'Vineri', sessions: [
      { time: '08:00', type: 'swim', title: 'Înot', detail: 'Rezistență continuă', icon: '🏊' },
      { time: '20:00', type: 'gym', title: 'Accesorii', detail: 'Core & Brațe', icon: '🏋️' },
    ]
  },
  {
    day: 'Sâmbătă', sessions: [
      { time: '09:00', type: 'run', title: 'Club Run', detail: '4km easy, social', icon: '🏃' },
      { time: '11:00', type: 'bike', title: 'Long Ride', detail: 'Z2, ritm ușor', icon: '🚴' },
    ]
  },
  {
    day: 'Duminică', sessions: [
      { time: '08:00', type: 'run', title: 'Long Run', detail: 'Z2, conversațional', icon: '🏃' },
      { time: '', type: 'rest', title: 'REST COMPLET', detail: 'Recuperare', icon: '😴' },
    ]
  },
];

// ============================================
// Phase 1 Weekly Volumes (Weeks 1-16)
// ============================================
export const PHASE1_VOLUMES = [
  { week: 1, swim: 1500, swimPerSession: 500, runTotal: 18, easyRun: 6, longRun: 12, bikeTotal: 40, easyRide: 15, longRide: 25, gym: 4 },
  { week: 2, swim: 1800, swimPerSession: 600, runTotal: 20, easyRun: 7, longRun: 13, bikeTotal: 45, easyRide: 15, longRide: 30, gym: 4 },
  { week: 3, swim: 2100, swimPerSession: 700, runTotal: 22, easyRun: 8, longRun: 14, bikeTotal: 50, easyRide: 15, longRide: 35, gym: 4 },
  { week: 4, swim: 1400, swimPerSession: 470, runTotal: 15, easyRun: 5, longRun: 10, bikeTotal: 35, easyRide: 10, longRide: 25, gym: 3, deload: true },
  { week: 5, swim: 2400, swimPerSession: 800, runTotal: 24, easyRun: 8, longRun: 16, bikeTotal: 55, easyRide: 20, longRide: 35, gym: 4 },
  { week: 6, swim: 2700, swimPerSession: 900, runTotal: 26, easyRun: 9, longRun: 17, bikeTotal: 60, easyRide: 20, longRide: 40, gym: 4 },
  { week: 7, swim: 3000, swimPerSession: 1000, runTotal: 28, easyRun: 10, longRun: 18, bikeTotal: 65, easyRide: 20, longRide: 45, gym: 4 },
  { week: 8, swim: 2000, swimPerSession: 670, runTotal: 18, easyRun: 6, longRun: 12, bikeTotal: 45, easyRide: 15, longRide: 30, gym: 3, deload: true },
  { week: 9, swim: 3300, swimPerSession: 1100, runTotal: 30, easyRun: 10, longRun: 20, bikeTotal: 75, easyRide: 25, longRide: 50, gym: 4 },
  { week: 10, swim: 3600, swimPerSession: 1200, runTotal: 32, easyRun: 11, longRun: 21, bikeTotal: 80, easyRide: 25, longRide: 55, gym: 4 },
  { week: 11, swim: 3900, swimPerSession: 1300, runTotal: 34, easyRun: 12, longRun: 22, bikeTotal: 85, easyRide: 25, longRide: 60, gym: 4 },
  { week: 12, swim: 2600, swimPerSession: 870, runTotal: 22, easyRun: 8, longRun: 14, bikeTotal: 55, easyRide: 20, longRide: 35, gym: 3, deload: true },
  { week: 13, swim: 4200, swimPerSession: 1400, runTotal: 36, easyRun: 12, longRun: 24, bikeTotal: 90, easyRide: 30, longRide: 60, gym: 4 },
  { week: 14, swim: 4500, swimPerSession: 1500, runTotal: 38, easyRun: 13, longRun: 25, bikeTotal: 95, easyRide: 30, longRide: 65, gym: 4 },
  { week: 15, swim: 4800, swimPerSession: 1600, runTotal: 40, easyRun: 14, longRun: 26, bikeTotal: 100, easyRide: 30, longRide: 70, gym: 4 },
  { week: 16, swim: 3200, swimPerSession: 1070, runTotal: 26, easyRun: 9, longRun: 17, bikeTotal: 65, easyRide: 20, longRide: 45, gym: 3, deload: true },
];

// ============================================
// Phase 2 Weekly Volumes (Weeks 17-32)
// ============================================
export const PHASE2_VOLUMES = [
  { week: 17, swim: 5100, runTotal: 40, easyRun: 10, longRun: 25, brickRun: 5, bikeTotal: 105, tempoRide: 30, longRide: 75, gym: 4 },
  { week: 18, swim: 5400, runTotal: 42, easyRun: 10, longRun: 26, brickRun: 6, bikeTotal: 115, tempoRide: 35, longRide: 80, gym: 4 },
  { week: 19, swim: 5700, runTotal: 44, easyRun: 11, longRun: 27, brickRun: 6, bikeTotal: 120, tempoRide: 35, longRide: 85, gym: 4 },
  { week: 20, swim: 3800, runTotal: 28, easyRun: 8, longRun: 17, brickRun: 3, bikeTotal: 80, tempoRide: 25, longRide: 55, gym: 3, deload: true },
  { week: 21, swim: 6000, runTotal: 46, easyRun: 12, longRun: 28, brickRun: 6, bikeTotal: 130, tempoRide: 40, longRide: 90, gym: 4 },
  { week: 22, swim: 6300, runTotal: 48, easyRun: 12, longRun: 29, brickRun: 7, bikeTotal: 140, tempoRide: 40, longRide: 100, gym: 4 },
  { week: 23, swim: 6600, runTotal: 50, easyRun: 13, longRun: 30, brickRun: 7, bikeTotal: 150, tempoRide: 45, longRide: 105, gym: 4 },
  { week: 24, swim: 4400, runTotal: 32, easyRun: 9, longRun: 20, brickRun: 3, bikeTotal: 100, tempoRide: 30, longRide: 70, gym: 3, deload: true },
  { week: 25, swim: 6900, runTotal: 50, easyRun: 13, longRun: 30, brickRun: 7, bikeTotal: 155, tempoRide: 45, longRide: 110, gym: 4 },
  { week: 26, swim: 7200, runTotal: 52, easyRun: 14, longRun: 30, brickRun: 8, bikeTotal: 160, tempoRide: 50, longRide: 110, gym: 4 },
  { week: 27, swim: 7500, runTotal: 54, easyRun: 14, longRun: 32, brickRun: 8, bikeTotal: 165, tempoRide: 50, longRide: 115, gym: 4 },
  { week: 28, swim: 5000, runTotal: 35, easyRun: 10, longRun: 21, brickRun: 4, bikeTotal: 110, tempoRide: 35, longRide: 75, gym: 3, deload: true },
  { week: 29, swim: 7800, runTotal: 54, easyRun: 14, longRun: 32, brickRun: 8, bikeTotal: 170, tempoRide: 50, longRide: 120, gym: 4 },
  { week: 30, swim: 8100, runTotal: 56, easyRun: 15, longRun: 33, brickRun: 8, bikeTotal: 175, tempoRide: 50, longRide: 125, gym: 4 },
  { week: 31, swim: 8400, runTotal: 58, easyRun: 15, longRun: 34, brickRun: 9, bikeTotal: 180, tempoRide: 55, longRide: 125, gym: 4 },
  { week: 32, swim: 5600, runTotal: 38, easyRun: 10, longRun: 22, brickRun: 6, bikeTotal: 120, tempoRide: 35, longRide: 85, gym: 3, deload: true },
];

// ============================================
// Phase 3 Weekly Volumes (Weeks 33-44)
// ============================================
export const PHASE3_VOLUMES = [
  { week: 33, swim: 8500, runTotal: 55, longRun: 30, brickRun: 8, bikeTotal: 185, longRide: 130, gym: 4 },
  { week: 34, swim: 9000, runTotal: 57, longRun: 32, brickRun: 8, bikeTotal: 195, longRide: 135, gym: 4 },
  { week: 35, swim: 9500, runTotal: 60, longRun: 33, brickRun: 9, bikeTotal: 200, longRide: 140, gym: 4 },
  { week: 36, swim: 6500, runTotal: 40, longRun: 0, brickRun: 0, bikeTotal: 130, longRide: 0, gym: 3, simulation: true, simLabel: 'SIMULARE 1' },
  { week: 37, swim: 9500, runTotal: 58, longRun: 32, brickRun: 9, bikeTotal: 200, longRide: 140, gym: 4 },
  { week: 38, swim: 10000, runTotal: 60, longRun: 33, brickRun: 10, bikeTotal: 210, longRide: 150, gym: 4 },
  { week: 39, swim: 10000, runTotal: 62, longRun: 35, brickRun: 10, bikeTotal: 220, longRide: 155, gym: 4 },
  { week: 40, swim: 7000, runTotal: 42, longRun: 0, brickRun: 0, bikeTotal: 140, longRide: 0, gym: 3, simulation: true, simLabel: 'SIMULARE 2' },
  { week: 41, swim: 10000, runTotal: 60, longRun: 33, brickRun: 10, bikeTotal: 215, longRide: 150, gym: 4 },
  { week: 42, swim: 10000, runTotal: 62, longRun: 35, brickRun: 10, bikeTotal: 220, longRide: 160, gym: 4 },
  { week: 43, swim: 9500, runTotal: 58, longRun: 32, brickRun: 8, bikeTotal: 200, longRide: 140, gym: 4 },
  { week: 44, swim: 6500, runTotal: 38, longRun: 22, brickRun: 5, bikeTotal: 130, longRide: 90, gym: 3, deload: true },
];

// ============================================
// Phase 4 Taper (Weeks 45-48)
// ============================================
export const PHASE4_VOLUMES = [
  { week: 45, swim: 7000, runTotal: 42, bikeTotal: 150, gym: 3 },
  { week: 46, swim: 5000, runTotal: 30, bikeTotal: 110, gym: 2 },
  { week: 47, swim: 3000, runTotal: 18, bikeTotal: 60, gym: 1 },
  { week: 48, swim: 1500, runTotal: 10, bikeTotal: 30, gym: 0, raceWeek: true },
];

// All volumes combined
export function getWeekVolume(weekNum) {
  const all = [...PHASE1_VOLUMES, ...PHASE2_VOLUMES, ...PHASE3_VOLUMES, ...PHASE4_VOLUMES];
  return all.find(v => v.week === weekNum) || null;
}

// ============================================
// Gym Program (Updated)
// ============================================
export const GYM_PROGRAMS = {
  lower: {
    name: 'Lower',
    day: 'Luni',
    focus: 'Picioare (unica zi)',
    notes: 'RIR 3-4. Fără eșec! Greutate moderată, control maxim pe femural.',
    exercises: [
      { name: 'Pendulum Squat sau Leg Press', sets: '3 × 8-10', rest: '2-3 min', notes: 'Safe pt femural. Control.' },
      { name: 'Bulgarian Split Squat (gantere)', sets: '2 × 10/picior', rest: '90s', notes: 'Stabilitate unilaterală' },
      { name: 'Leg Extensions', sets: '3 × 12-15', rest: '60s', notes: 'Izolare cvadricepși' },
      { name: 'Leg Curls (ușoare)', sets: '2 × 12-15', rest: '60s', notes: 'Prehab femural, greutate UȘOARĂ' },
      { name: 'Calf Raises', sets: '3 × 15-20', rest: '45s', notes: 'Ahile + gambe' },
      { name: 'Ab Rollout / Plank', sets: '3 × max', rest: '60s', notes: 'Core stabil' },
    ]
  },
  upper1: {
    name: 'Upper 1 — Push',
    day: 'Miercuri',
    focus: 'Piept, Umeri, Tricepși',
    exercises: [
      { name: 'Chest Press Machine / Smith Bench', sets: '3 × 6-8', rest: '2-3 min', notes: 'Forță piept' },
      { name: 'Înclinat cu Gantere', sets: '3 × 8-10', rest: '90s', notes: 'Hipertrofie piept superior' },
      { name: 'OHP Gantere (din șezut)', sets: '3 × 8-10', rest: '90s', notes: 'Umeri' },
      { name: 'Dips aparat / Push-ups', sets: '2 × 10-12', rest: '60s', notes: 'Tricepși + piept' },
      { name: 'Laterale cu gantere', sets: '3 × 12-15', rest: '45s', notes: 'Umeri laterali' },
      { name: 'Face Pulls', sets: '3 × 15-20', rest: '45s', notes: '🔑 Sănătate umeri' },
    ]
  },
  upper2: {
    name: 'Upper 2 — Pull',
    day: 'Joi',
    focus: 'Spate, Bicepși',
    exercises: [
      { name: 'Tracțiuni / Helcometru', sets: '3 × 6-10', rest: '2 min', notes: 'Transfer → crawl' },
      { name: 'Ramat cu gantere (pe bancă)', sets: '3 × 8-10', rest: '90s', notes: 'Unilateral, controlat' },
      { name: 'Seated Cable Row', sets: '3 × 10-12', rest: '60s', notes: 'Retracție scapulară' },
      { name: 'Flexii biceps gantere', sets: '2 × 10-12', rest: '60s', notes: 'Brațe' },
      { name: 'Straight Arm Pulldown', sets: '2 × 12-15', rest: '60s', notes: 'Dorsali → crawl' },
      { name: 'Face Pulls', sets: '2 × 15-20', rest: '45s', notes: 'Sănătate umeri' },
    ]
  },
  conditioning: {
    name: 'Conditioning — Hyrox',
    day: 'Marți',
    focus: 'Cardio + Rezistență',
    variants: [
      {
        name: 'Circuit (8 stații)',
        format: '2 min muncă, 30s tranziție, 2-3 runde',
        stations: [
          'Rowing 500m', 'Wall Balls × 15-20', 'Sled Push 25m + retur',
          'Burpee Broad Jumps × 8-10', 'Ski Erg 30 cal', 'Farmers Walk 40m',
          'Assault Bike 15 cal', 'Sandbag Over Shoulder × 8-10'
        ]
      },
      {
        name: 'EMOM 30 min',
        format: '10 runde × 3 mișcări',
        stations: ['Min 1: Rowing 12 cal', 'Min 2: KB Swings × 12', 'Min 3: Push-ups × 15 + Plank']
      },
      {
        name: 'Mini Hyrox Sim',
        format: 'For Time (target 25-35 min)',
        stations: [
          'Row 1.000m', 'Sled Push 4×25m', 'Ski Erg 1.000m', 'Wall Balls × 50',
          'Assault Bike 30 cal', 'Farmers Walk 4×25m', 'Sandbag Lunges 4×25m', 'Row 500m'
        ]
      }
    ]
  },
  accesorii: {
    name: 'Accesorii — Core & Brațe',
    day: 'Vineri',
    focus: 'Recuperare activă, postură, brațe',
    exercises: [
      { name: 'Plank cu greutate', sets: '3 × 45-60s', rest: '60s', notes: 'Core stability' },
      { name: 'Russian Twists', sets: '3 × 20 (10/side)', rest: '45s', notes: 'Oblici' },
      { name: 'Flexii Biceps (Bara Z)', sets: '3 × 12-15', rest: '60s', notes: 'Pompaj brațe' },
      { name: 'Extensii Triceps (Sfoară)', sets: '3 × 12-15', rest: '60s', notes: 'Pompaj brațe' },
      { name: 'Ridicări laterale cu gantere', sets: '3 × 15-20', rest: '45s', notes: 'Deltoid lateral' },
      { name: 'Stretching general', sets: '10 min', rest: '-', notes: 'Mobilitate și recuperare' },
    ]
  }
};

// ============================================
// Benchmarks
// ============================================
export const BENCHMARKS = [
  { week: 8, month: 'Oct', tests: ['Înoți 800m crawl non-stop în bazin'] },
  { week: 16, month: 'Dec', tests: ['Înoți 1.500m crawl non-stop', 'Alergi 25km', 'Pedalezi 70km'] },
  { week: 24, month: 'Feb', tests: ['Înoți 2.500m', 'Alergi 30km', 'Pedalezi 100km', 'Brick completat'] },
  { week: 32, month: 'Apr', tests: ['Înoți 3.000m', 'Alergi 34km', 'Pedalezi 125km', 'Gut training 60g/h'] },
  { week: 36, month: 'Mai', tests: ['SIMULARE 1: Înot 2.5km + Bicicletă 100km + Alergare 15km'] },
  { week: 40, month: 'Jun', tests: ['SIMULARE 2: Înot 3km + Bicicletă 130km + Alergare 21km'] },
  { week: 44, month: 'Jul', tests: ['Înoți 3.8km apă deschisă', 'Pedalezi 160km', 'Alergi 35km'] },
  { week: 48, month: 'Aug', tests: ['🏁 TERMINI IRONMAN-UL'] },
];

// Race targets
export const RACE_TARGETS = {
  swim: { distance: '3.8 km', target: '1:20 - 1:40' },
  bike: { distance: '180 km', target: '6:00 - 7:00' },
  run: { distance: '42.2 km', target: '4:30 - 5:30' },
  total: '12:00 - 14:00',
};

// ============================================
// User Profile & Nutrition
// ============================================
export const USER_PROFILE = {
  weightKg: 95,
  heightCm: 185, // estimated
  age: 26,
  gender: 'male',
};

// Calculate Basal Metabolic Rate (Mifflin-St Jeor)
export function getBMR() {
  const p = USER_PROFILE;
  return Math.round(10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + 5);
}

// Get dynamic nutrition targets based on daily active calories (from Coros)
export function getDailyNutritionTargets(activeCalories = 0) {
  const bmr = getBMR();
  const neat = bmr * 1.2; // Sedentary/office multiplier for base day
  const targetCalories = Math.round(neat + activeCalories);

  // Macros (Protein fixed at ~2g/kg, Fat fixed at 0.8g/kg)
  const protein = Math.round(USER_PROFILE.weightKg * 2); // 190g
  const fat = Math.round(USER_PROFILE.weightKg * 0.8); // 76g
  
  // Remaining calories go to Carbs
  // Protein = 4 kcal/g, Fat = 9 kcal/g, Carbs = 4 kcal/g
  const remainingCals = targetCalories - (protein * 4) - (fat * 9);
  const carbs = Math.max(100, Math.round(remainingCals / 4));

  return {
    bmr,
    targetCalories,
    protein,
    fat,
    carbs
  };
}

// Nutrition supplements
export const NUTRITION = {
  supplements: [
    { name: 'Creatină monohidrat', dose: '5g/zi' },
    { name: 'Proteină whey', dose: '1-2 shakere/zi (40-60g)' },
    { name: 'Electroliți', dose: 'Pe antrenamente >60 min' },
    { name: 'Vitamina D', dose: '2000-4000 UI/zi' },
    { name: 'Magneziu', dose: '400mg seara' },
  ]
};

// ============================================
// Coaching Engine: Dynamic Workout Generator
// ============================================

export function getWorkoutPrescription(weekNum, sessionType, title, detail) {
  const vol = getWeekVolume(weekNum);
  const phase = getCurrentPhase(weekNum);

  title = title || '';
  detail = detail || '';
  
  let prescription = {
    title: `${title} (${detail})`,
    targets: [],
    structure: []
  };

  const isLong = title.toLowerCase().includes('long') || detail.toLowerCase().includes('long');
  const isTempo = title.toLowerCase().includes('tempo') || detail.toLowerCase().includes('tempo') || detail.toLowerCase().includes('intervale');

  // Parse explicit distance if provided (e.g., "4km easy")
  let explicitDistKm = null;
  let explicitDistM = null;
  const distMatch = (title + ' ' + (detail || '')).match(/(\d+(?:\.\d+)?)\s*(km|m)\b/i);
  if (distMatch) {
    const val = parseFloat(distMatch[1]);
    if (distMatch[2].toLowerCase() === 'km') {
      explicitDistKm = val;
    } else {
      explicitDistM = val;
    }
  }

  if (sessionType === 'swim') {
    const totalDist = explicitDistM !== null ? explicitDistM : (explicitDistKm !== null ? explicitDistKm * 1000 : vol.swimPerSession || 1000);
    
    if (phase.id === 'foundation') {
      prescription.targets = ['Zonă: Z2', 'Focus: Formă și Alunecare (Glide)'];
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `400m relaxat (alternând 50m Crawl / 50m Bras).` },
        { name: 'Drills (Tehnică)', desc: `4 x 50m Catch-up drill. 4 x 50m Kicking cu pluta. (Pauză 15s)` },
        { name: 'Main Set (MS)', desc: `${Math.max(100, totalDist - 800)}m Crawl Z2 cu Pull Buoy (focus pe rotația bazinului).` },
        { name: 'Cool Down (CD)', desc: `200m foarte încet.` }
      ];
    } else if (phase.id === 'build' || phase.id === 'peak') {
      prescription.targets = ['Zonă: Z3 (CSS)', 'Focus: Anduranță specifică cursă'];
      const reps = Math.max(1, Math.floor((totalDist - 600) / 200));
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `300m Crawl + 100m build (progresiv spre Z3).` },
        { name: 'Main Set (MS)', desc: `${reps} x 200m la pace-ul tău de cursă (CSS / Z3). Pauză strictă 20s între repetări.` },
        { name: 'Cool Down (CD)', desc: `200m Z1 relaxat.` }
      ];
    }
    prescription.calculatedDistanceKm = totalDist / 1000;
    prescription.calculatedDurationMin = Math.round((totalDist / 100) * 2); // estimate 2min/100m
  } 
  else if (sessionType === 'run') {
    const defaultDist = isLong ? vol.longRun : (isTempo ? vol.tempoRun || vol.easyRun : vol.easyRun);
    const dist = explicitDistKm !== null ? explicitDistKm : defaultDist;

    if (isLong) {
      prescription.targets = ['Zonă: Z2 (116-136 BPM)', `Pace: ${ATHLETE.pace10k} + 45s`, 'Nutriție: 60g Carbs/oră'];
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `15 min alergare foarte ușoară, lăsând pulsul să urce treptat în Z2.` },
        { name: 'Main Set (MS)', desc: `${Math.max(1, dist - 3)}km la ritm constant Z2. Focus pe postură înaltă și cadență ~170-180 spm. Consumă 1 gel la fiecare 45 min.` },
        { name: 'Cool Down (CD)', desc: `10 min mers alert pentru a scoate acidul lactic.` }
      ];
    } else if (isTempo) {
      prescription.targets = ['Zonă: Z3/Z4 (136-175 BPM)', `Pace: ${ATHLETE.pace10k}`];
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `15 min Z1-Z2. La final, 4 x 20s accelerări (strides) pentru trezirea sistemului nervos.` },
        { name: 'Main Set (MS)', desc: phase.id === 'build' 
            ? `4 x 1.5km la ritm de semi-maraton (Z3). Pauză de 90 secunde jog Z1 între ele.` 
            : `Fartlek: 10 x (1 min Z4 tare / 1 min Z1 încet) pe un parcurs valurit.` },
        { name: 'Cool Down (CD)', desc: `15 min Z1 înapoi acasă.` }
      ];
    } else {
      prescription.targets = ['Zonă: Z1 (sub 116 BPM)', 'Pace: Conversațional'];
      prescription.structure = [
        { name: 'Recovery Run', desc: `Efort extrem de ușor. Dacă poți respira doar pe nas, ești în zona bună. ${dist}km pentru a lubrifia articulațiile.` }
      ];
    }
    prescription.calculatedDistanceKm = dist;
    prescription.calculatedDurationMin = Math.round(dist * 6); // estimate 6min/km
  }
  else if (sessionType === 'bike') {
    const defaultDist = isLong ? vol.longRide : (isTempo ? vol.tempoRide || vol.easyRide : vol.easyRide);
    const dist = explicitDistKm !== null ? explicitDistKm : defaultDist;
    
    if (isLong) {
      prescription.targets = ['Zonă: Z2 (116-136 BPM)', 'Cadență: 85-95 RPM', 'Aerodinamicitate'];
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `20 min Z1, rotind ușor picioarele la >90 RPM.` },
        { name: 'Main Set (MS)', desc: `${Math.max(1, dist - 15)}km Z2 constant. Alternează 15 min în aero-bars cu 5 min pe hood-uri. Hidratare cu electroliți la fiecare 15 min.` },
        { name: 'Cool Down (CD)', desc: `15 min pe foaia mică (granny gear), spinning ușor.` }
      ];
    } else if (isTempo) {
      prescription.targets = ['Zonă: Z3/Z4 (136-160 BPM)', 'Sweet Spot Power'];
      prescription.structure = [
        { name: 'Warm-Up (WU)', desc: `15 min progresiv. Încorporează 3 x (1 min cadență > 105 RPM / 1 min ușor).` },
        { name: 'Intervale Sweet Spot', desc: phase.id === 'peak' 
            ? `3 x 20 min în Z3 (aproape de FTP, efort perceput 7/10). Pauză activă 5 min Z1.` 
            : `4 x 10 min Z3 cu 3 min pauză Z1.` },
        { name: 'Cool Down (CD)', desc: `10 min Z1.` }
      ];
    } else {
      prescription.targets = ['Zonă: Z1 (Recuperare)', 'Cadență: > 95 RPM'];
      prescription.structure = [
        { name: 'Active Recovery / Recovery Ride', desc: `Efort extrem de ușor. ${dist}km pentru a lubrifia articulațiile.` }
      ];
    }
    prescription.calculatedDistanceKm = dist;
    prescription.calculatedDurationMin = Math.round(dist * 2.5); // estimate 2.5min/km
  }
  else if (sessionType === 'gym') {
    prescription.targets = ['Focus: Prevenție accidentări & Transfer de putere', 'RIR: 3 (Fără Eșec)'];
    prescription.structure = [
      { name: 'Mobilitate', desc: '10 min. 90/90s, Cat-Cow, Spiderman lunges cu rotație toracică.' },
      { name: 'Core', desc: 'Urmează structura din fila "Program Sală". Atenție maximă la execuție, nu forța greutățile.' },
      { name: 'Revenire', desc: '5 min stretching pasiv.' }
    ];
  }
  else if (sessionType === 'conditioning') {
    prescription.targets = ['Focus: Toleranță la lactat / Hyrox-style', 'Puls: Z3 spre Z4'];
    prescription.structure = [
      { name: 'AMRAP 25 min', desc: 'As Many Rounds As Possible: 1km Run (sau SkiErg) + 30 Wall Balls + 30m Sandbag Walking Lunges. Păstrează un ritm constant (nu sprint din prima rundă).' },
    ];
  }
  return prescription;
}

export function getDynamicWeekSchedule(weekNum) {
  const phase = getCurrentPhase(weekNum);
  // In a real app we'd have a WEEKLY_TEMPLATE_PHASE2, for now we reuse PHASE1 template structure
  const baseTemplate = JSON.parse(JSON.stringify(WEEKLY_TEMPLATE_PHASE1));

  return baseTemplate.map(day => {
    day.sessions.forEach(s => {
      if (s.type === 'rest' || s.type === 'other') return;
      
      const prescription = getWorkoutPrescription(weekNum, s.type, s.title, s.detail);
      
      if (s.type === 'run' || s.type === 'bike' || s.type === 'swim') {
        const distStr = s.type === 'swim' ? `${prescription.calculatedDistanceKm * 1000}m` : `${prescription.calculatedDistanceKm.toFixed(1)}km`;
        const durStr = `${prescription.calculatedDurationMin}min`;
        s.detail = `${distStr} ${durStr}`;
      } else {
        s.detail = prescription.calculatedDurationMin ? `${prescription.calculatedDurationMin}min` : '60min';
      }
    });
    return day;
  });
}
