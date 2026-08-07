const STORAGE_KEY = 'ISTIGHFAR_APP_DATA_V4';

const defaultState = {
  count: 0,
  target: 1000,
  todayTotal: 0,
  lifetimeTotal: 0,
  kCompletedCount: 0,
  streakDays: 1,
  lastActiveDate: new Date().toDateString(),
  soundEnabled: true,
  unlockedBadges: [],
  dailyHistory: {}
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...defaultState,
        ...parsed,
        unlockedBadges: new Set(parsed.unlockedBadges || []),
        dailyHistory: parsed.dailyHistory || {}
      };
    }
  } catch (e) {}
  return { ...defaultState, unlockedBadges: new Set(), dailyHistory: {} };
}

let state = loadState();

function saveState() {
  try {
    const toSave = {
      ...state,
      unlockedBadges: Array.from(state.unlockedBadges)
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {}
}

function getFormattedDate(d = new Date()) {
  return d.toISOString().split('T')[0];
}

const MILESTONES = [
  { count: 33,        title: 'Seed of Devotion',        desc: 'Completed 33 Istighfar',                tier: 0, xp: 33 },
  { count: 100,       title: 'First Step',              desc: 'Reached 100 Istighfar',                 tier: 1, xp: 100 },
  { count: 500,       title: 'Awakened Seeker',         desc: 'Completed 500 Istighfar',               tier: 2, xp: 500 },
  { count: 1000,      title: 'Devoted Pilgrim',         desc: 'Achieved 1,000 Istighfar',              tier: 3, xp: 1000 },
  { count: 5000,      title: 'Golden Adept',            desc: 'Reached 5,000 Istighfar',               tier: 4, xp: 5000 },
  { count: 10000,     title: 'Champion Seeker',         desc: 'Reached 10,000 Istighfar',              tier: 5, xp: 10000 },
  { count: 25000,     title: 'Radiant Heart',           desc: 'Completed 25,000 Istighfar',            tier: 2, xp: 25000 },
  { count: 50000,     title: 'Celestial Pilgrim',       desc: 'Completed 50,000 Istighfar',            tier: 1, xp: 50000 },
  { count: 100000,    title: 'Ocean of Mercy',          desc: 'Achieved 100,000 Istighfar',            tier: 5, xp: 100000 },
  { count: 250000,    title: 'Light Bearer',            desc: 'Reached 250,000 Istighfar',             tier: 3, xp: 250000 },
  { count: 500000,    title: 'Cosmic Master',           desc: 'Completed 500,000 Istighfar',           tier: 4, xp: 500000 },
  { count: 1000000,   title: 'Pillar of Repentance',    desc: 'Achieved 1,000,000 Lifetime Istighfar', tier: 5, xp: 1000000 },
  // ── Elite Tier ──
  { count: 2500000,   title: 'Master of Istighfar',     desc: 'An extraordinary 2,500,000 Istighfar',  tier: 6, xp: 2500000 },
  { count: 5000000,   title: 'Beacon of Devotion',      desc: 'Half of ten million — SubhanAllah',     tier: 7, xp: 5000000 },
  { count: 10000000,  title: 'Al-Musaafir — Millionist',desc: 'Ten million Istighfar. MashaAllah!',    tier: 8, xp: 10000000 }
];

// Standard tiers 0-5, then Elite tiers 6 (Rose Gold), 7 (Deep Emerald), 8 (Glowing Cyan)
const TIER_COLORS = [
  '#94a3b8', // 0 – Slate
  '#38bdf8', // 1 – Sky Blue
  '#a78bfa', // 2 – Violet
  '#f59e0b', // 3 – Amber
  '#10b981', // 4 – Emerald
  '#f472b6', // 5 – Pink
  '#e8a87c', // 6 – Rose Gold  ✦ Elite
  '#00b894', // 7 – Deep Emerald ✦ Elite
  '#00cec9'  // 8 – Glowing Cyan ✦ Elite
];

const duaPhrases = {
  "1": { arabic: "أَسْتَغْفِرُ اللَّهَ", trans: '"I seek forgiveness from Allah"' },
  "2": { arabic: "أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ", trans: '"I seek forgiveness from Allah and turn to Him in repentance"' },
  "3": { arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ", trans: '"O Allah, You are my Lord. There is no deity except You..."' },
  "4": { arabic: "رَبِّ اغْفِرْ لِي وَتُبْ عَلَيَّ", trans: '"My Lord, forgive me and accept my repentance"' }
};

const SVG_STAR   = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 2z"/></svg>`;
const SVG_LOCK   = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>`;
// Special icons for elite tiers (6-8)
const SVG_FLAME  = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 23c-4.97 0-9-3.6-9-8 0-3.2 2-6 5-7.5-.5 1.5-.2 3 .8 4 1-3 3-5.5 5.5-7-.5 2 .5 4 2 5.5.5-1.5 1.2-3 2.2-4C19.5 8 21 11 21 14c0 4.97-4.03 9-9 9z"/></svg>`;
const SVG_CROWN  = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M5 16L3 6l5.5 5L12 4l3.5 7L21 6l-2 10H5zm0 2h14v2H5v-2z"/></svg>`;
const SVG_GALAXY = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2c1 0 1.8.7 2.3 1.7.9-.3 1.9-.4 2.7 0 .5.3.9.8 1 1.4.6.4 1 1 1.1 1.7.1.7-.1 1.4-.5 2 .4.6.5 1.3.3 2-.2.6-.7 1.2-1.3 1.5.1.7 0 1.5-.5 2-.5.6-1.2.9-2 .9-.4.6-1 1.1-1.8 1.2-.7.1-1.4-.1-2-.5-.6.4-1.3.5-2 .4-.7-.2-1.3-.7-1.6-1.3-.7 0-1.4-.3-1.9-.8-.5-.5-.7-1.2-.6-1.9-.6-.4-1.1-1-1.3-1.7-.2-.7 0-1.4.3-2-.4-.6-.5-1.3-.3-2 .2-.6.7-1.2 1.3-1.5-.1-.7 0-1.5.5-2 .5-.6 1.2-.9 2-.9.4-.6 1-1.1 1.8-1.2.4-.1.8 0 1.2.1C10.5 4.4 11.2 4 12 4z"/></svg>`;

// Map tier -> badge icon (elite tiers use special icons)
function getTierIcon(tier, unlocked) {
  if (!unlocked) return SVG_LOCK;
  if (tier === 8) return SVG_GALAXY;
  if (tier === 7) return SVG_CROWN;
  if (tier === 6) return SVG_FLAME;
  return SVG_STAR;
}

// DOM Elements
const body = document.body;
const counterDisplay = document.getElementById('counterDisplay');
const targetLabel = document.getElementById('targetLabel');
const progressRing = document.getElementById('progressRing');
const tapBtn = document.getElementById('tapBtn');
const duaSelect = document.getElementById('duaSelect');
const arabicText = document.getElementById('arabicText');
const transliterationText = document.getElementById('transliterationText');
const todayTotalDisplay = document.getElementById('todayTotalDisplay');
const lifetimeTotalDisplay = document.getElementById('lifetimeTotalDisplay');
const rankSubtitle = document.getElementById('rankSubtitle');
const levelBadge = document.getElementById('levelBadge');
const floatContainer = document.getElementById('floatContainer');
const badgesContainer = document.getElementById('badgesContainer');

// Toast
const toastNotification = document.getElementById('toastNotification');
const toastTitle = document.getElementById('toastTitle');
const toastDesc = document.getElementById('toastDesc');
const toastIcon = document.getElementById('toastIcon');

// Controls
const soundToggle = document.getElementById('soundToggle');
const undoBtn = document.getElementById('undoBtn');
const resetBtn = document.getElementById('resetBtn');

// Focus Mode Elements
const focusBtn = document.getElementById('focusBtn');
const focusOverlay = document.getElementById('focusOverlay');
const exitFocusBtn = document.getElementById('exitFocusBtn');

// Modals
const infoModal = document.getElementById('infoModal');
const infoBtn = document.getElementById('infoBtn');
const closeInfoModal = document.getElementById('closeInfoModal');

const milestonesModal = document.getElementById('milestonesModal');
const milestonesBtn = document.getElementById('milestonesBtn');
const closeMilestonesModal = document.getElementById('closeMilestonesModal');

const settingsModal = document.getElementById('settingsModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeSettingsModal = document.getElementById('closeSettingsModal');

const targetModal = document.getElementById('targetModal');
const customTargetBtn = document.getElementById('customTargetBtn');
const customTargetInput = document.getElementById('customTargetInput');
const applyTargetBtn = document.getElementById('applyTargetBtn');
const cancelTargetBtn = document.getElementById('cancelTargetBtn');

// Data Management
const exportDataBtn = document.getElementById('exportDataBtn');
const importFileInput = document.getElementById('importFileInput');
const fullResetBtn = document.getElementById('fullResetBtn');

// Analytics
const weeklyChartContainer = document.getElementById('weeklyChartContainer');
const chartTotalLabel = document.getElementById('chartTotalLabel');
const heatmapGrid = document.getElementById('heatmapGrid');
const heatmapMonths = document.getElementById('heatmapMonths');

// Modal stats
const modalLevelTitle = document.getElementById('modalLevelTitle');
const modalXpText = document.getElementById('modalXpText');
const xpProgressBar = document.getElementById('xpProgressBar');
const nextLevelLabel = document.getElementById('nextLevelLabel');

const statTotalIstighfar = document.getElementById('statTotalIstighfar');
const statStreak = document.getElementById('statStreak');
const stat1kCount = document.getElementById('stat1kCount');
const statBadgesEarned = document.getElementById('statBadgesEarned');

const ringRadius = 124;
const ringCircumference = 2 * Math.PI * ringRadius;

let audioCtx = null;

function playClickSound(pitchShift = 0) {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(550 + pitchShift, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180 + pitchShift, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {}
}

function playMilestoneSound() {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.3, audioCtx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.08);
      osc.stop(audioCtx.currentTime + idx * 0.08 + 0.35);
    });
  } catch (e) {}
}

function triggerTargetReward() {
  playMilestoneSound();
  for (let i = 0; i < 30; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.backgroundColor = ['#10b981', '#38bdf8', '#f59e0b'][Math.floor(Math.random() * 3)];

    const angle = Math.random() * Math.PI * 2;
    const dist = 80 + Math.random() * 120;
    p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
    p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);

    p.style.left = '50%';
    p.style.top = '50%';
    floatContainer.appendChild(p);
    setTimeout(() => p.remove(), 2200);
  }
}

function updateRankDisplay() {
  const effectiveTotal = Math.max(state.count, state.lifetimeTotal);

  // 12-level rank system
  let rank, lvl, nextThreshold;

  // 15-level rank system — culminates at 10,000,000
  if (effectiveTotal >= 10000000)    { rank = 'Al-Musaafir';            lvl = 15; nextThreshold = Infinity; }
  else if (effectiveTotal >= 5000000) { rank = 'Eternal Remembrance';   lvl = 14; nextThreshold = 10000000; }
  else if (effectiveTotal >= 2500000) { rank = 'Beacon of Devotion';    lvl = 13; nextThreshold = 5000000; }
  else if (effectiveTotal >= 1000000) { rank = 'Master of Istighfar';   lvl = 12; nextThreshold = 2500000; }
  else if (effectiveTotal >= 500000)  { rank = 'Pillar of Repentance';  lvl = 11; nextThreshold = 1000000; }
  else if (effectiveTotal >= 250000)  { rank = 'Cosmic Master';         lvl = 10; nextThreshold = 500000; }
  else if (effectiveTotal >= 100000)  { rank = 'Light Bearer';          lvl = 9;  nextThreshold = 250000; }
  else if (effectiveTotal >= 50000)   { rank = 'Ocean of Mercy';        lvl = 8;  nextThreshold = 100000; }
  else if (effectiveTotal >= 25000)   { rank = 'Celestial Pilgrim';     lvl = 7;  nextThreshold = 50000; }
  else if (effectiveTotal >= 10000)   { rank = 'Radiant Heart';         lvl = 6;  nextThreshold = 25000; }
  else if (effectiveTotal >= 5000)    { rank = 'Champion Seeker';       lvl = 5;  nextThreshold = 10000; }
  else if (effectiveTotal >= 2500)    { rank = 'Golden Adept';          lvl = 4;  nextThreshold = 5000; }
  else if (effectiveTotal >= 1000)    { rank = 'Devoted Pilgrim';       lvl = 3;  nextThreshold = 2500; }
  else if (effectiveTotal >= 500)     { rank = 'Awakened Seeker';       lvl = 2;  nextThreshold = 1000; }
  else                                { rank = 'Novice Seeker';         lvl = 1;  nextThreshold = 500; }

  rankSubtitle.textContent = `${rank} • ${effectiveTotal.toLocaleString()} XP`;
  levelBadge.textContent = `★${lvl}`;

  const percent = state.target > 0 ? Math.min(100, Math.round((state.count / state.target) * 100)) : 0;
  targetLabel.textContent = `${percent}% • Goal ${state.target.toLocaleString()}`;

  modalLevelTitle.textContent = `Rank ${lvl} • ${rank}`;
  modalXpText.textContent = `${effectiveTotal.toLocaleString()} XP`;

  const xpPercent = nextThreshold === Infinity
    ? 100
    : Math.min(100, (effectiveTotal / nextThreshold) * 100);
  xpProgressBar.style.width = `${xpPercent}%`;
  nextLevelLabel.textContent = nextThreshold === Infinity
    ? 'Al-Musaafir achieved — SubhanAllah! 🌙✨'
    : `${(nextThreshold - effectiveTotal).toLocaleString()} XP until next tier`;
}

function checkMilestones() {
  const currentVal = Math.max(state.count, state.lifetimeTotal);

  MILESTONES.forEach(m => {
    if (currentVal >= m.count && !state.unlockedBadges.has(m.count)) {
      state.unlockedBadges.add(m.count);
      if (m.count === 1000) state.kCompletedCount++;
      showMilestoneToast(m);
      spawnFloatingText(m.title);
      playMilestoneSound();
      saveState();
    }
  });
  renderBadgesList();
}

function showMilestoneToast(milestone) {
  toastIcon.innerHTML = SVG_STAR;
  toastTitle.textContent = `Unlocked: ${milestone.title}`;
  toastDesc.textContent = milestone.desc;

  toastNotification.classList.remove('hidden');
  setTimeout(() => {
    toastNotification.classList.add('hidden');
  }, 4500);
}

function spawnFloatingText(text) {
  const el = document.createElement('div');
  el.className = 'floating-milestone text-[13px] font-semibold text-slate-100 bg-slate-900/95 border theme-accent-border px-3 py-1.5 rounded-full soft-shadow backdrop-blur-md flex items-center gap-1.5';
  el.innerHTML = `<span class="theme-accent-text">${SVG_STAR}</span><span>${text}</span>`;
  floatContainer.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function renderBadgesList() {
  badgesContainer.innerHTML = '';
  const currentVal = Math.max(state.count, state.lifetimeTotal);

  MILESTONES.forEach(m => {
    const unlocked = state.unlockedBadges.has(m.count) || currentVal >= m.count;
    if (unlocked) state.unlockedBadges.add(m.count);
    const tierColor = TIER_COLORS[m.tier % TIER_COLORS.length];

    const card = document.createElement('div');
    card.className = `p-2.5 rounded-xl border flex items-center justify-between transition-all ${
      unlocked
        ? 'bg-black/25 border-white/[0.08] text-slate-100 soft-shadow-sm'
        : 'bg-black/10 border-white/[0.03] text-slate-600 opacity-60'
    }`;

    const isElite = m.tier >= 6;
    const badgeIcon = getTierIcon(m.tier, unlocked);
    // Elite badges get a subtle glow ring
    const eliteRing = isElite && unlocked
      ? `box-shadow:0 0 10px ${tierColor}55;`
      : '';

    card.innerHTML = `
      <div class="flex items-center space-x-2.5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:${unlocked ? tierColor + '22' : 'rgba(255,255,255,0.02)'}; color:${unlocked ? tierColor : '#475569'}; border:1px solid ${unlocked ? tierColor + '55' : 'rgba(255,255,255,0.04)'}; ${eliteRing}">
          ${badgeIcon}
        </div>
        <div>
          <div class="flex items-center gap-1">
            <div class="text-[11px] font-semibold ${unlocked ? 'text-slate-100' : 'text-slate-500'}">${m.title}</div>
            ${isElite && unlocked ? '<span style="font-size:8px;color:' + tierColor + ';background:' + tierColor + '18;border:1px solid ' + tierColor + '44;padding:0 5px;border-radius:999px;font-weight:700;letter-spacing:.05em;">ELITE</span>' : ''}
          </div>
          <div class="text-[9px] ${unlocked ? 'text-slate-500' : 'text-slate-600'}">${m.desc}</div>
        </div>
      </div>
      <div>
        ${unlocked
          ? `<span style="font-size:8px;font-weight:700;color:${tierColor};background:${tierColor}18;padding:2px 8px;border-radius:999px;border:1px solid ${tierColor}33;">UNLOCKED</span>`
          : `<span class="text-[9px] text-slate-600 font-medium">${m.count.toLocaleString()} taps</span>`}
      </div>
    `;
    badgesContainer.appendChild(card);
  });
}

function renderWeeklyChart() {
  weeklyChartContainer.innerHTML = '';
  const days = [];
  let maxVal = 1;
  let weeklySum = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const iso = getFormattedDate(d);
    const count = state.dailyHistory[iso] || 0;
    if (count > maxVal) maxVal = count;
    weeklySum += count;

    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    days.push({ dayName, count, iso });
  }

  chartTotalLabel.textContent = `${weeklySum.toLocaleString()} total this week`;

  days.forEach(item => {
    const heightPct = Math.max(8, Math.round((item.count / maxVal) * 100));
    const col = document.createElement('div');
    col.className = 'flex-1 flex flex-col items-center gap-1 h-full justify-end';
    col.innerHTML = `
      <div class="text-[8px] text-slate-400 font-mono">${item.count > 0 ? item.count : ''}</div>
      <div class="w-full theme-accent-bg rounded-t opacity-85 transition-all duration-300" style="height: ${heightPct}%"></div>
      <div class="text-[9px] text-slate-500 font-medium">${item.dayName}</div>
    `;
    weeklyChartContainer.appendChild(col);
  });
}

function renderHeatmap() {
  heatmapGrid.innerHTML = '';
  heatmapMonths.innerHTML = '';

  const totalWeeks = 26; // ~6 months of history
  const totalDays = totalWeeks * 7;
  const today = new Date();
  
  const dayOfWeek = today.getDay(); 
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + (6 - dayOfWeek));

  const startDate = new Date(endDate);
  startDate.setDate(endDate.getDate() - totalDays + 1);

  let currentMonth = -1;
  const monthCols = [];

  for (let week = 0; week < totalWeeks; week++) {
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + week * 7);
    const month = weekStartDate.getMonth();

    if (month !== currentMonth) {
      currentMonth = month;
      const monthName = weekStartDate.toLocaleDateString('en-US', { month: 'short' });
      monthCols.push({ name: monthName, weekIndex: week });
    }
  }

  let lastIndex = 0;
  monthCols.forEach((m) => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.gridColumnStart = `${m.weekIndex + 1}`;
    heatmapMonths.appendChild(span);
    lastIndex = m.weekIndex;
  });

  for (let i = 0; i < totalDays; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    const iso = getFormattedDate(d);
    const count = state.dailyHistory[iso] || 0;

    let level = 0;
    if (count > 2000) level = 4;
    else if (count > 800) level = 3;
    else if (count > 300) level = 2;
    else if (count > 0) level = 1;

    const cell = document.createElement('div');
    cell.className = `hm-cell hm-level-${level}`;
    
    const formattedDateStr = d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    cell.setAttribute('data-tooltip', `${formattedDateStr}: ${count.toLocaleString()} Istighfar`);

    heatmapGrid.appendChild(cell);
  }
}

function updateProgress() {
  counterDisplay.textContent = state.count.toLocaleString();
  todayTotalDisplay.textContent = state.todayTotal.toLocaleString();
  lifetimeTotalDisplay.textContent = state.lifetimeTotal.toLocaleString();

  const progress = Math.min(state.count / state.target, 1);
  const offset = ringCircumference - (progress * ringCircumference);
  progressRing.style.strokeDashoffset = offset;

  if (state.count >= state.target && state.target > 0) {
    tapBtn.classList.add('glow-pulse');
  } else {
    tapBtn.classList.remove('glow-pulse');
  }

  statTotalIstighfar.textContent = state.lifetimeTotal.toLocaleString();
  statStreak.textContent = `${state.streakDays}`;
  stat1kCount.textContent = state.kCompletedCount.toLocaleString();
  statBadgesEarned.textContent = `${state.unlockedBadges.size}/${MILESTONES.length}`;

  updateRankDisplay();
}

function checkDailyReset() {
  const currentTodayStr = new Date().toDateString();
  if (state.lastActiveDate !== currentTodayStr) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (state.lastActiveDate === yesterday.toDateString()) {
      state.streakDays++;
    } else {
      state.streakDays = 1;
    }
    
    state.todayTotal = 0;
    state.count = 0; 
    state.lastActiveDate = currentTodayStr;
    saveState();

    updateProgress();
    renderBadgesList();
  }
}

// Initial evaluation on script load
checkDailyReset();

function handleTap() {
  checkDailyReset(); // Handles mid-session date crossovers seamlessly

  state.count++;
  state.todayTotal++;
  state.lifetimeTotal++;

  const iso = getFormattedDate();
  state.dailyHistory[iso] = (state.dailyHistory[iso] || 0) + 1;

  if (state.count === state.target) {
    triggerTargetReward();
  }

  checkMilestones();
  playClickSound(Math.min(300, Math.floor((state.count % 100) / 10) * 8));
  updateProgress();
  saveState();
}

function handleUndo() {
  if (state.count > 0) {
    state.count--;
    if (state.todayTotal > 0) state.todayTotal--;
    if (state.lifetimeTotal > 0) state.lifetimeTotal--;

    const iso = getFormattedDate();
    if (state.dailyHistory[iso] && state.dailyHistory[iso] > 0) {
      state.dailyHistory[iso]--;
    }

    updateProgress();
    saveState();
  }
}

function handleReset() {
  if (state.count === 0) return;
  const confirmed = window.confirm(
    `Reset current session? You're at ${state.count.toLocaleString()} taps.\n\nThis only clears the counter on screen — your daily and lifetime totals stay saved.`
  );
  if (!confirmed) return;
  state.count = 0;
  updateProgress();
  saveState();
}

function handleFullReset() {
  const confirmed = window.confirm(
    "Full Data Reset\n\nThis will permanently delete ALL your lifetime totals, streaks, earned badges, and activity history.\n\nAre you sure you want to proceed?"
  );

  if (confirmed) {
    state = {
      ...defaultState,
      unlockedBadges: new Set(),
      dailyHistory: {}
    };
    localStorage.removeItem(STORAGE_KEY);
    saveState();
    updateProgress();
    renderBadgesList();
    renderWeeklyChart();
    renderHeatmap();
    settingsModal.classList.add('hidden');
    alert("All data has been reset to zero.");
  }
}

function setTarget(newTarget) {
  state.target = parseInt(newTarget) || 1000;
  document.querySelectorAll('.target-btn').forEach(btn => {
    if (parseInt(btn.getAttribute('data-target')) === state.target) {
      btn.className = 'target-btn px-2 py-1 text-[10px] font-semibold rounded-lg theme-accent-bg text-slate-950 font-bold transition';
    } else {
      btn.className = 'target-btn px-2 py-1 text-[10px] font-semibold rounded-lg bg-white/[0.05] text-slate-400 hover:text-slate-100 transition';
    }
  });
  updateProgress();
  saveState();
}

// Focus Mode Logic
function enableFocusMode() {
  document.body.classList.add('focus-mode');
  focusOverlay.classList.remove('hidden');
}

function disableFocusMode() {
  document.body.classList.remove('focus-mode');
  focusOverlay.classList.add('hidden');
}

// Event Listeners
tapBtn.addEventListener('click', handleTap);
undoBtn.addEventListener('click', handleUndo);
resetBtn.addEventListener('click', handleReset);
fullResetBtn.addEventListener('click', handleFullReset);

focusBtn.addEventListener('click', enableFocusMode);
exitFocusBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  disableFocusMode();
});

focusOverlay.addEventListener('click', (e) => {
  if (e.target !== exitFocusBtn && !exitFocusBtn.contains(e.target)) {
    handleTap();
  }
});

document.querySelectorAll('.target-btn').forEach(btn => {
  btn.addEventListener('click', (e) => setTarget(e.target.getAttribute('data-target')));
});

customTargetBtn.addEventListener('click', () => {
  customTargetInput.value = state.target;
  targetModal.classList.remove('hidden');
});

cancelTargetBtn.addEventListener('click', () => targetModal.classList.add('hidden'));

applyTargetBtn.addEventListener('click', () => {
  const val = parseInt(customTargetInput.value);
  if (val && val > 0) {
    setTarget(val);
    targetModal.classList.add('hidden');
  }
});

duaSelect.addEventListener('change', (e) => {
  const selected = duaPhrases[e.target.value];
  if (selected) {
    arabicText.textContent = selected.arabic;
    transliterationText.textContent = selected.trans;
  }
});

soundToggle.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.classList.toggle('on', state.soundEnabled);
  saveState();
});

// Modals
milestonesBtn.addEventListener('click', () => milestonesModal.classList.remove('hidden'));
closeMilestonesModal.addEventListener('click', () => milestonesModal.classList.add('hidden'));

settingsBtn.addEventListener('click', () => {
  renderWeeklyChart();
  renderHeatmap();
  settingsModal.classList.remove('hidden');
});
closeSettingsModal.addEventListener('click', () => settingsModal.classList.add('hidden'));

infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));

// User Guide Modal
const guideModal = document.getElementById('guideModal');
const openGuideModalBtn = document.getElementById('openGuideModalBtn');
const closeGuideModalBtn = document.getElementById('closeGuideModalBtn');

openGuideModalBtn.addEventListener('click', () => {
  settingsModal.classList.add('hidden'); // Close settings
  guideModal.classList.remove('hidden');
});
closeGuideModalBtn.addEventListener('click', () => {
  guideModal.classList.add('hidden');
  settingsModal.classList.remove('hidden'); // Re-open settings
});

// Export Data JSON (Supports Capacitor APK & Web)
exportDataBtn.addEventListener('click', async () => {
  const fileName = `istighfar_backup_${getFormattedDate()}.json`;

  // IMPORTANT: Convert unlockedBadges Set to Array before serializing.
  // JSON.stringify on a Set produces '{}' which is invalid for restore.
  const exportPayload = {
    ...state,
    unlockedBadges: Array.from(state.unlockedBadges)
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);

  // Check if running natively inside Capacitor (Android/iOS APK)
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Share } = window.Capacitor.Plugins;

      // 1. Write the backup file to the app's cache directory.
      //    Use string literals for Directory/Encoding — they are enums
      //    not exposed on window.Capacitor.Plugins.
      const writeFileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: 'CACHE',
        encoding: 'utf8'
      });

      // 2. Open Android's native share sheet so user can save/send the file.
      await Share.share({
        title: 'Export Istighfar Backup',
        text: 'Backup data file for Istighfar App',
        url: writeFileResult.uri,
        dialogTitle: 'Save or Send Backup File'
      });
    } catch (err) {
      alert('Export failed: ' + (err.message || JSON.stringify(err)));
    }
  } else {
    // Fallback for Standard Web Browsers
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const dlAnchor = document.createElement('a');
    dlAnchor.href = url;
    dlAnchor.download = fileName;

    document.body.appendChild(dlAnchor);
    dlAnchor.click();

    setTimeout(() => {
      document.body.removeChild(dlAnchor);
      URL.revokeObjectURL(url);
    }, 100);
  }
});

// Import Data JSON
// Trigger the file input from the importDataBtn (more reliable on Android WebView)
const importDataBtn = document.getElementById('importDataBtn');
if (importDataBtn) {
  importDataBtn.addEventListener('click', () => {
    importFileInput.value = ''; // reset so same file can be re-imported
    importFileInput.click();
  });
}

importFileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (imported && typeof imported === 'object' && typeof imported.lifetimeTotal === 'number') {
        state = {
          ...defaultState,
          ...imported,
          unlockedBadges: new Set(Array.isArray(imported.unlockedBadges) ? imported.unlockedBadges : []),
          dailyHistory: imported.dailyHistory || {}
        };
        saveState();
        updateProgress();
        renderBadgesList();
        renderWeeklyChart();
        renderHeatmap();

        e.target.value = '';
        settingsModal.classList.add('hidden'); // close the modal after restore
        alert('Data restored successfully! ✅');
      } else {
        alert('Invalid backup file. Make sure you select an Istighfar backup (.json) file.');
      }
    } catch (err) {
      alert('Error reading backup file: ' + (err.message || err));
    }
  };
  reader.onerror = () => {
    alert('Could not read the file. Please try again.');
  };
  reader.readAsText(file);
});

// Quick Action Launcher
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('action') === 'quick-tap') {
  handleTap();
}

// Initialize UI
progressRing.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
soundToggle.classList.toggle('on', state.soundEnabled);
renderBadgesList();
updateProgress();

if ('serviceWorker' in navigator) {
  if (window.Capacitor) {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
    if (window.caches) {
      caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
    }
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('SW Registered:', reg.scope))
        .catch((err) => console.log('SW Registration failed:', err));
    });
  }
}