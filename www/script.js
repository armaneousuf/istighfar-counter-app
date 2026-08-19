import { defaultState, duaPhrases, getFormattedDate } from './js/constants.js';
import { clearState, loadState, saveState as persistState } from './js/storage.js';
import { hapticTap } from './js/services/haptics.js';
import { setDailyReminder } from './js/services/notifications.js';
import { calculatePrayerTimes, formatPrayerTime, saveLocation, getSavedLocation, clearSavedLocation } from './js/services/prayer.js';

// Anonymous Mode Global Variables
let isAnonymous = false;
let anonymousCount = 0;

let state = null;

function saveState() {
  if (!isAnonymous) {
    persistState(state).catch((err) => console.error('Failed to save state', err));
  }
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
  { count: 2500000,   title: 'Master of Istighfar',     desc: 'An extraordinary 2,500,000 Istighfar',  tier: 6, xp: 2500000 },
  { count: 5000000,   title: 'Beacon of Devotion',      desc: 'Half of ten million — SubhanAllah',     tier: 7, xp: 5000000 },
  { count: 10000000,  title: 'Al-Musaafir — Millionist',desc: 'Ten million Istighfar. MashaAllah!',    tier: 8, xp: 10000000 }
];

const TIER_COLORS = [
  '#94a3b8', '#38bdf8', '#a78bfa', '#f59e0b',
  '#10b981', '#f472b6', '#e8a87c', '#00b894', '#00cec9'
];


const SVG_STAR   = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 2l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 2z"/></svg>`;
const SVG_LOCK   = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>`;
const SVG_FLAME  = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 23c-4.97 0-9-3.6-9-8 0-3.2 2-6 5-7.5-.5 1.5-.2 3 .8 4 1-3 3-5.5 5.5-7-.5 2 .5 4 2 5.5.5-1.5 1.2-3 2.2-4C19.5 8 21 11 21 14c0 4.97-4.03 9-9 9z"/></svg>`;
const SVG_CROWN  = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M5 16L3 6l5.5 5L12 4l3.5 7L21 6l-2 10H5zm0 2h14v2H5v-2z"/></svg>`;
const SVG_GALAXY = `<svg viewBox="0 0 24 24" class="w-4 h-4" fill="currentColor"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 2c1 0 1.8.7 2.3 1.7.9-.3 1.9-.4 2.7 0 .5.3.9.8 1 1.4.6.4 1 1 1.1 1.7.1.7-.1 1.4-.5 2 .4.6.5 1.3.3 2-.2.6-.7 1.2-1.3 1.5.1.7 0 1.5-.5 2-.5.6-1.2.9-2 .9-.4.6-1 1.1-1.8 1.2-.7.1-1.4-.1-2-.5-.6.4-1.3.5-2 .4-.7-.2-1.3-.7-1.6-1.3-.7 0-1.4-.3-1.9-.8-.5-.5-.7-1.2-.6-1.9-.6-.4-1.1-1-1.3-1.7-.2-.7 0-1.4.3-2-.4-.6-.5-1.3-.3-2 .2-.6.7-1.2 1.3-1.5-.1-.7 0-1.5.5-2 .5-.6 1.2-.9 2-.9.4-.6 1-1.1 1.8-1.2.4-.1.8 0 1.2.1C10.5 4.4 11.2 4 12 4z"/></svg>`;

function getTierIcon(tier, unlocked) {
  if (!unlocked) return SVG_LOCK;
  if (tier === 8) return SVG_GALAXY;
  if (tier === 7) return SVG_CROWN;
  if (tier === 6) return SVG_FLAME;
  return SVG_STAR;
}

// DOM Elements
const counterDisplay = document.getElementById('counterDisplay');
const targetLabel = document.getElementById('targetLabel');
const progressRing = document.getElementById('progressRing');
const tapBtn = document.getElementById('tapBtn');
const duaSelect = document.getElementById('duaSelect');
const arabicText = document.getElementById('arabicText');
const transliterationText = document.getElementById('transliterationText');
const todayTotalDisplay = document.getElementById('todayTotalDisplay');
const lifetimeTotalDisplay = document.getElementById('lifetimeTotalDisplay');
const floatContainer = document.getElementById('floatContainer');
const badgesContainer = document.getElementById('badgesContainer');

// Playground Elements
const pgTargetChips = document.querySelectorAll('.pg-target-chip');
const pgTapBtn = document.getElementById('pgTapBtn');
const pgCounterDisplay = document.getElementById('pgCounterDisplay');
const pgTargetLabel = document.getElementById('pgTargetLabel');
const pgProgressRing = document.getElementById('pgProgressRing');
const pgFloatContainer = document.getElementById('pgFloatContainer');
const pgRoundsToday = document.getElementById('pgRoundsToday');
const pgResetBtn = document.getElementById('pgResetBtn');
const pgCustomChip = document.getElementById('pgCustomChip');
const pgRingCircumference = 2 * Math.PI * 110;

// Anonymous Mode UI Elements
const anonymousBtn = document.getElementById('anonymousBtn');
const anonymousBanner = document.getElementById('anonymousBanner');
const exitAnonymousBtn = document.getElementById('exitAnonymousBtn');

// Toast
const toastNotification = document.getElementById('toastNotification');
const toastTitle = document.getElementById('toastTitle');
const toastDesc = document.getElementById('toastDesc');
const toastIcon = document.getElementById('toastIcon');

// Controls
const soundToggle = document.getElementById('soundToggle');
const hapticsToggle = document.getElementById('hapticsToggle');
const reminderToggle = document.getElementById('reminderToggle');
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

const settingsModal = document.getElementById('view-settings');

const targetModal = document.getElementById('targetModal');
const goalChipBtn = document.getElementById('goalChipBtn');
const goalChipValue = document.getElementById('goalChipValue');
const customTargetInput = document.getElementById('customTargetInput');
const applyTargetBtn = document.getElementById('applyTargetBtn');
const cancelTargetBtn = document.getElementById('cancelTargetBtn');

// Data Management
const exportDataBtn = document.getElementById('exportDataBtn');
const importFileInput = document.getElementById('importFileInput');
const fullResetBtn = document.getElementById('fullResetBtn');

// Analytics
const weeklyChartCanvas = document.getElementById('weeklyChartCanvas');
let weeklyChartInstance = null;
const chartTotalLabel = document.getElementById('chartTotalLabel');
const heatmapGrid = document.getElementById('heatmapGrid');
const heatmapMonths = document.getElementById('heatmapMonths');
const insightDate = document.getElementById('insightDate');
const insightTodayProgress = document.getElementById('insightTodayProgress');
const insightTodayRemaining = document.getElementById('insightTodayRemaining');
const insightTodayBar = document.getElementById('insightTodayBar');
const insightWeekTotal = document.getElementById('insightWeekTotal');
const insightActiveDays = document.getElementById('insightActiveDays');
const insightRhythmLabel = document.getElementById('insightRhythmLabel');

// Stats Displays
const modalLevelTitle = document.getElementById('modalLevelTitle');
const modalXpText = document.getElementById('modalXpText');
const xpProgressBar = document.getElementById('xpProgressBar');
const nextLevelLabel = document.getElementById('nextLevelLabel');

const statTotalIstighfar = document.getElementById('lifetimeTotalDisplay');
const statStreak = document.getElementById('statStreak');
const statBestStreak = document.getElementById('statBestStreak');
const stat1kCount = document.getElementById('stat1kCount');
const statBadgesEarned = document.getElementById('statBadgesEarned');

// Streaks View Displays
const streakBigNumber = document.getElementById('streakBigNumber');
const streakBestDisplay = document.getElementById('streakBestDisplay');
const streak1kDisplay = document.getElementById('streak1kDisplay');
const streakWeekRow = document.getElementById('streakWeekRow');
const prayerList = document.getElementById('prayerList');
const prayerStatus = document.getElementById('prayerStatus');
const prayerLocation = document.getElementById('prayerLocation');
const locationPermBtn = document.getElementById('locationPermBtn');

const ringRadius = 124;
const ringCircumference = 2 * Math.PI * ringRadius;

let audioCtx = null;

function getCurrentStreak(history = state?.dailyHistory || {}) {
  let streak = 0;
  const cursor = new Date();
  while ((history[getFormattedDate(cursor)] || 0) > 0) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

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

// ============ PLAYGROUND (free-count tab) ============
// Independent of the main Istighfar counter/streaks — a lightweight
// round-based tally for reciting any dua, with sound + haptic on completion.
let pgCount = 0;

function playRoundCompleteSound() {
  if (!state.soundEnabled) return;
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const notes = [659.25, 987.77];
    notes.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime + idx * 0.12);

      gain.gain.setValueAtTime(0.28, audioCtx.currentTime + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.12 + 0.3);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(audioCtx.currentTime + idx * 0.12);
      osc.stop(audioCtx.currentTime + idx * 0.12 + 0.3);
    });
  } catch (e) {}
}

function checkPlaygroundDailyReset() {
  const todayStr = getFormattedDate();
  if (state.playgroundRoundsDate !== todayStr) {
    state.playgroundRoundsDate = todayStr;
    state.playgroundRoundsToday = 0;
    saveState();
  }
}

function renderPlaygroundChips() {
  const target = state.playgroundTarget;
  const isPreset = [33, 99, 100].includes(target);
  pgTargetChips.forEach((chip) => {
    const chipTarget = chip.getAttribute('data-target');
    const isActive = chipTarget === 'custom'
      ? !isPreset
      : Number(chipTarget) === target;
    chip.classList.toggle('active', isActive);
  });
  if (pgCustomChip) {
    pgCustomChip.textContent = isPreset ? 'Custom' : `Custom (${target})`;
  }
}

function updatePlaygroundDisplay() {
  if (pgCounterDisplay) pgCounterDisplay.textContent = pgCount.toLocaleString();
  if (pgTargetLabel) pgTargetLabel.textContent = state.playgroundTarget.toLocaleString();
  if (pgRoundsToday) pgRoundsToday.textContent = state.playgroundRoundsToday.toLocaleString();

  const progress = Math.min(pgCount / state.playgroundTarget, 1);
  const offset = pgRingCircumference - (progress * pgRingCircumference);
  if (pgProgressRing) pgProgressRing.style.strokeDashoffset = offset;
}

function renderPlayground() {
  checkPlaygroundDailyReset();
  renderPlaygroundChips();
  updatePlaygroundDisplay();
}

function setPlaygroundTarget(newTarget) {
  const target = Math.max(1, Math.floor(newTarget));
  if (!target) return;
  state.playgroundTarget = target;
  pgCount = 0;
  renderPlaygroundChips();
  updatePlaygroundDisplay();
  saveState();
}

function spawnPlaygroundFloat(text) {
  if (!pgFloatContainer) return;
  const el = document.createElement('div');
  el.className = 'floating-milestone text-[13px] font-semibold text-slate-100 bg-slate-900/95 border theme-accent-border px-3 py-1.5 rounded-full soft-shadow backdrop-blur-md flex items-center gap-1.5';
  el.innerHTML = `<span class="theme-accent-text">${SVG_STAR}</span><span>${text}</span>`;
  pgFloatContainer.appendChild(el);
  setTimeout(() => el.remove(), 1400);
}

function handlePlaygroundTap() {
  pgCount++;

  if (pgCount >= state.playgroundTarget) {
    checkPlaygroundDailyReset();
    state.playgroundRoundsToday++;
    playRoundCompleteSound();
    hapticTap(state.hapticsEnabled);
    spawnPlaygroundFloat(`Round complete · ${state.playgroundTarget}`);
    pgCount = 0;
    saveState();
  } else {
    playClickSound(Math.min(300, Math.floor((pgCount % 100) / 10) * 8));
    hapticTap(state.hapticsEnabled);
  }

  updatePlaygroundDisplay();
}

function handlePlaygroundReset() {
  pgCount = 0;
  updatePlaygroundDisplay();
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
  const percent = state.target > 0 ? Math.min(100, Math.floor(((isAnonymous ? anonymousCount : state.count) / state.target) * 100)) : 0;
  targetLabel.textContent = `${percent}% • Goal ${state.target.toLocaleString()}`;
  if (goalChipValue) goalChipValue.textContent = state.target.toLocaleString();

  if (isAnonymous) {
    if (modalLevelTitle) modalLevelTitle.textContent = 'Anonymous Mode';
    if (modalXpText) modalXpText.textContent = 'Session Only';
    return;
  }

  const effectiveTotal = Math.max(state.count, state.lifetimeTotal);

  let rank, lvl, nextThreshold;

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

  if (modalLevelTitle) modalLevelTitle.textContent = `Rank ${lvl} • ${rank}`;
  if (modalXpText) modalXpText.textContent = `${effectiveTotal.toLocaleString()} XP`;

  const xpPercent = nextThreshold === Infinity
    ? 100
    : Math.min(100, (effectiveTotal / nextThreshold) * 100);
  if (xpProgressBar) xpProgressBar.style.width = `${xpPercent}%`;
  if (nextLevelLabel) {
    nextLevelLabel.textContent = nextThreshold === Infinity
      ? 'Al-Musaafir achieved — SubhanAllah!'
      : `${(nextThreshold - effectiveTotal).toLocaleString()} XP until next rank`;
  }
}

function checkMilestones() {
  if (isAnonymous) return;
  const currentVal = Math.max(state.count, state.lifetimeTotal);

  MILESTONES.forEach(m => {
    if (currentVal >= m.count && !state.unlockedBadges.has(m.count)) {
      state.unlockedBadges.add(m.count);
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
  if (!badgesContainer) return;
  badgesContainer.innerHTML = '';
  const currentVal = Math.max(state.count, state.lifetimeTotal);

  MILESTONES.forEach(m => {
    const unlocked = state.unlockedBadges.has(m.count) || currentVal >= m.count;
    if (unlocked && !isAnonymous) state.unlockedBadges.add(m.count);
    const tierColor = TIER_COLORS[m.tier % TIER_COLORS.length];

    const card = document.createElement('div');
    card.className = `p-2.5 rounded-xl border flex items-center justify-between transition-all ${
      unlocked
        ? 'bg-black/25 border-white/[0.08] text-slate-100 soft-shadow-sm'
        : 'bg-black/10 border-white/[0.03] text-slate-600 opacity-60'
    }`;

    const isElite = m.tier >= 6;
    const badgeIcon = getTierIcon(m.tier, unlocked);
    const eliteRing = isElite && unlocked ? `box-shadow:0 0 10px ${tierColor}55;` : '';

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
  if (!weeklyChartCanvas) return;
  const ctx = weeklyChartCanvas.getContext('2d');
  
  const days = [];
  const counts = [];
  let weeklySum = 0;

  getCurrentWeekDays().forEach(({ date: d, count }) => {
    weeklySum += count;
    const dayName = d.toLocaleDateString('en-US', { weekday: 'narrow' });
    days.push(dayName);
    counts.push(count);
  });

  if (chartTotalLabel) chartTotalLabel.textContent = `${weeklySum.toLocaleString()} total this week`;

  if (weeklyChartInstance) {
    weeklyChartInstance.data.labels = days;
    weeklyChartInstance.data.datasets[0].data = counts;
    weeklyChartInstance.update();
  } else {
    if (typeof Chart === 'undefined') return;
    
    weeklyChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{
          data: counts,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          hoverBackgroundColor: 'rgba(52, 211, 153, 1)',
          borderRadius: 4,
          borderSkipped: false,
          barThickness: 'flex',
          maxBarThickness: 24
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#94a3b8',
            bodyColor: '#f8fafc',
            displayColors: false,
            callbacks: {
              title: () => null,
              label: (ctx) => `${ctx.raw.toLocaleString()} taps`
            }
          }
        },
        scales: {
          x: {
            grid: { display: false, drawBorder: false },
            ticks: { color: '#64748b', font: { size: 9, family: 'monospace' } },
            border: { display: false }
          },
          y: {
            display: false,
            min: 0
          }
        },
        animation: {
          duration: 400
        }
      }
    });
  }
}

function getCurrentWeekDays() {
  const today = new Date();
  const sunday = new Date(today);
  sunday.setDate(today.getDate() - today.getDay()); // back up to this week's Sunday

  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push({
      date: d,
      count: state.dailyHistory[getFormattedDate(d)] || 0
    });
  }
  return days;
}

function renderInsightSummary() {
  if (!state) return;

  const today = state.todayTotal || 0;
  const target = state.target || 1000;
  const percentage = Math.min(100, Math.round((today / target) * 100));
  const remaining = Math.max(0, target - today);
  const week = getCurrentWeekDays();
  const weeklyTotal = week.reduce((sum, day) => sum + day.count, 0);
  const activeDays = week.filter((day) => day.count > 0).length;

  if (insightDate) {
    insightDate.textContent = new Date().toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  }
  if (insightTodayProgress) insightTodayProgress.textContent = today.toLocaleString();
  if (insightTodayRemaining) {
    insightTodayRemaining.textContent = percentage >= 100
      ? `Goal reached · ${target.toLocaleString()}`
      : `${remaining.toLocaleString()} remaining of ${target.toLocaleString()}`;
  }
  if (insightTodayBar) insightTodayBar.style.width = `${percentage}%`;
  if (insightWeekTotal) insightWeekTotal.textContent = weeklyTotal.toLocaleString();
  if (insightActiveDays) insightActiveDays.textContent = `${activeDays}/7`;
  if (insightRhythmLabel) insightRhythmLabel.textContent = `${activeDays}/7 active`;
}

function renderHeatmap() {
  if (!heatmapGrid || !heatmapMonths) return;
  heatmapGrid.innerHTML = '';
  heatmapMonths.innerHTML = '';

  const totalWeeks = 26;
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

  monthCols.forEach((m) => {
    const span = document.createElement('span');
    span.textContent = m.name;
    span.style.gridColumnStart = `${m.weekIndex + 1}`;
    heatmapMonths.appendChild(span);
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

function renderStreakWeek() {
  if (!streakWeekRow) return;
  streakWeekRow.innerHTML = '';
  const week = getCurrentWeekDays(); // calendar week, Sun–Sat, matches Insights/chart
  const todayStr = getFormattedDate();

  week.forEach(({ date: d, count }) => {
    const isToday = getFormattedDate(d) === todayStr;
    const dayLetter = d.toLocaleDateString('en-US', { weekday: 'narrow' });

    const dot = document.createElement('div');
    let colorClass = 'bg-white/[0.05] text-slate-500';
    if (count > 0) {
      colorClass = 'theme-accent-bg text-slate-950 font-bold';
    }
    if (isToday) {
      dot.style.outline = '1px solid var(--accent-color)';
    }

    dot.className = `streak-dot ${colorClass}`;
    dot.textContent = dayLetter;
    dot.setAttribute('data-tooltip', `${d.toLocaleDateString('en-US', { weekday: 'short' })}: ${count.toLocaleString()}`);
    streakWeekRow.appendChild(dot);
  });
}

function updateProgress() {
  const currentDisplayCount = isAnonymous ? anonymousCount : state.count;
  counterDisplay.textContent = currentDisplayCount.toLocaleString();

  if (isAnonymous) {
    if (todayTotalDisplay) todayTotalDisplay.textContent = '—';
    if (lifetimeTotalDisplay) lifetimeTotalDisplay.textContent = '—';
  } else {
    if (todayTotalDisplay) todayTotalDisplay.textContent = state.todayTotal.toLocaleString();
    if (lifetimeTotalDisplay) lifetimeTotalDisplay.textContent = state.lifetimeTotal.toLocaleString();
  }

  const progress = Math.min(currentDisplayCount / state.target, 1);
  const offset = ringCircumference - (progress * ringCircumference);
  progressRing.style.strokeDashoffset = offset;

  if (currentDisplayCount >= state.target && state.target > 0) {
    tapBtn.classList.add('glow-pulse');
  } else {
    tapBtn.classList.remove('glow-pulse');
  }

  if (statTotalIstighfar) statTotalIstighfar.textContent = state.lifetimeTotal.toLocaleString();
  if (statStreak) statStreak.textContent = `${state.streakDays}`;
  if (statBestStreak) statBestStreak.textContent = `${state.streakDays}`;
  // Derived directly from lifetimeTotal (source of truth) instead of a
  // separately-incremented counter, so it can never drift out of sync.
  const kCompletedCount = Math.floor(state.lifetimeTotal / 1000);
  if (stat1kCount) stat1kCount.textContent = kCompletedCount.toLocaleString();
  if (statBadgesEarned) statBadgesEarned.textContent = `${state.unlockedBadges.size}/${MILESTONES.length}`;

  if (streakBigNumber) streakBigNumber.textContent = state.streakDays;
  if (streakBestDisplay) streakBestDisplay.textContent = state.streakDays;
  if (streak1kDisplay) streak1kDisplay.textContent = kCompletedCount;

  updateRankDisplay();
  renderInsightSummary();
}

function checkDailyReset() {
  if (isAnonymous) return;

  const currentTodayStr = getFormattedDate();
  
  let lastActiveISO = state.lastActiveDate;
  if (state.lastActiveDate && state.lastActiveDate.includes(' ')) {
    const parsedDate = new Date(state.lastActiveDate);
    if (!isNaN(parsedDate.getTime())) {
      lastActiveISO = getFormattedDate(parsedDate);
    }
  }

  if (lastActiveISO !== currentTodayStr) {
    state.todayTotal = 0;
    state.count = 0; 
    state.lastActiveDate = currentTodayStr;
    state.streakDays = getCurrentStreak(state.dailyHistory);
    saveState();

    updateProgress();
    renderBadgesList();
  }
}

function toggleAnonymousMode(forceState = null) {
  isAnonymous = forceState !== null ? forceState : !isAnonymous;

  if (isAnonymous) {
    anonymousCount = 0;
    document.body.classList.add('anonymous-mode');
    anonymousBtn.classList.add('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
    anonymousBanner.classList.remove('hidden');
  } else {
    document.body.classList.remove('anonymous-mode');
    anonymousBtn.classList.remove('bg-amber-500/20', 'text-amber-400', 'border-amber-500/40');
    anonymousBanner.classList.add('hidden');
  }

  updateProgress();
}

function handleTap() {
  if (isAnonymous) {
    anonymousCount++;
    if (anonymousCount === state.target) {
      triggerTargetReward();
    }
    playClickSound(Math.min(300, Math.floor((anonymousCount % 100) / 10) * 8));
    hapticTap(state.hapticsEnabled);
    updateProgress();
    return;
  }

  checkDailyReset();

  state.count++;
  state.todayTotal++;
  state.lifetimeTotal++;

  const iso = getFormattedDate();
  state.dailyHistory[iso] = (state.dailyHistory[iso] || 0) + 1;
  state.streakDays = getCurrentStreak(state.dailyHistory);

  if (state.count === state.target) {
    triggerTargetReward();
  }

  checkMilestones();
  playClickSound(Math.min(300, Math.floor((state.count % 100) / 10) * 8));
  hapticTap(state.hapticsEnabled);
  updateProgress();
  saveState();
}

function handleUndo() {
  if (isAnonymous) {
    if (anonymousCount > 0) {
      anonymousCount--;
      updateProgress();
    }
    return;
  }

  if (state.count > 0) {
    state.count--;
    if (state.todayTotal > 0) state.todayTotal--;
    if (state.lifetimeTotal > 0) state.lifetimeTotal--;

    const iso = getFormattedDate();
    if (state.dailyHistory[iso] && state.dailyHistory[iso] > 0) {
      state.dailyHistory[iso]--;
    }
    state.streakDays = getCurrentStreak(state.dailyHistory);

    updateProgress();
    saveState();
  }
}

function handleReset() {
  if (isAnonymous) {
    anonymousCount = 0;
    updateProgress();
    return;
  }

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
    clearState().then(() => saveState()).catch(console.error);
    updateProgress();
    renderBadgesList();
    renderWeeklyChart();
    renderHeatmap();
    alert("All data has been reset to zero.");
  }
}

function setTarget(newTarget) {
  const parsedTarget = Number.parseInt(newTarget, 10);
  if (!Number.isFinite(parsedTarget) || parsedTarget < 1 || parsedTarget > 1000000) return false;
  state.target = parsedTarget;
  document.querySelectorAll('.target-btn').forEach(btn => {
    if (parseInt(btn.getAttribute('data-target')) === state.target) {
      btn.className = 'target-btn px-2 py-2 text-[11px] font-semibold rounded-lg theme-accent-bg text-slate-950 font-bold transition';
    } else {
      btn.className = 'target-btn px-2 py-2 text-[11px] font-semibold rounded-lg bg-white/[0.05] text-slate-400 hover:text-slate-100 transition';
    }
  });
  updateProgress();
  saveState();
  return true;
}

function renderPrayerTimes(latitude, longitude) {
  const times = calculatePrayerTimes(latitude, longitude);
  const entries = [
    ['Fajr', times.fajr],
    ['Sunrise', times.sunrise],
    ['Dhuhr', times.dhuhr],
    ['Asr', times.asr],
    ['Maghrib', times.maghrib],
    ['Isha', times.isha],
    ['Sunset', times.sunset]
  ];
  prayerList.innerHTML = entries.map(([name, time]) => `
    <div class="prayer-row ${name === 'Sunrise' || name === 'Sunset' ? 'opacity-75' : ''}">
      <span class="flex items-center gap-2 text-[11px] font-medium text-slate-300">
        <span class="w-1.5 h-1.5 rounded-full ${name === 'Sunrise' || name === 'Sunset' ? 'bg-amber-300' : 'theme-accent-bg'}"></span>${name}
      </span>
      <span class="text-[11px] text-slate-100 font-mono">${formatPrayerTime(time)}</span>
    </div>`).join('');
  prayerStatus.textContent = 'Karachi method · Hanafi Asr · calculated on device';
  prayerLocation.textContent = `${latitude.toFixed(3)}, ${longitude.toFixed(3)}`;
  locationPermBtn.querySelector('span').textContent = 'Refresh current location';
}

function loadPrayerTimes() {
  // Check if location is already saved
  const saved = getSavedLocation();
  if (saved) {
    renderPrayerTimes(saved.latitude, saved.longitude);
    return;
  }

  // If no saved location, request permission
  if (!navigator.geolocation) {
    prayerStatus.textContent = 'Location is unavailable on this device.';
    return;
  }

  prayerStatus.textContent = 'Finding your location…';
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      // Save the location for future use
      saveLocation(coords.latitude, coords.longitude);
      renderPrayerTimes(coords.latitude, coords.longitude);
    },
    () => { prayerStatus.textContent = 'Allow location to calculate local prayer times.'; },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 30 * 60 * 1000 }
  );
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

// Navigation Router Logic
function setupBottomNavbar() {
  const navButtons = document.querySelectorAll('#bottomNav .nav-btn');
  const views = document.querySelectorAll('#viewContainer .view');
  const header = document.getElementById('appHeader');

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (isAnonymous && btn.getAttribute('data-view') !== 'home') return;

      const targetViewId = `view-${btn.getAttribute('data-view')}`;

      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      views.forEach(v => {
        if (v.id === targetViewId) {
          v.classList.remove('hidden');
        } else {
          v.classList.add('hidden');
        }
      });

      // Toggle header buttons visibility
      if (targetViewId === 'view-home') {
        header.classList.remove('hide-nav-buttons');
      } else {
        header.classList.add('hide-nav-buttons');
      }

      // Auto-exit Anonymous and Focus modes when leaving the Home view
      if (targetViewId !== 'view-home') {
        if (isAnonymous) {
          toggleAnonymousMode(false);
        }
        if (!focusOverlay.classList.contains('hidden')) {
          disableFocusMode();
        }
      }

      if (targetViewId === 'view-insights') {
        renderInsightSummary();
        renderWeeklyChart();
        renderHeatmap();
      } else if (targetViewId === 'view-prayers') {
        loadPrayerTimes();
      } else if (targetViewId === 'view-streaks') {
        renderStreakWeek();
        renderBadgesList();
      } else if (targetViewId === 'view-playground') {
        renderPlayground();
      }
    });
  });
}

// Playground Event Listeners
if (pgTapBtn) pgTapBtn.addEventListener('click', handlePlaygroundTap);
if (pgResetBtn) pgResetBtn.addEventListener('click', handlePlaygroundReset);
pgTargetChips.forEach((chip) => {
  chip.addEventListener('click', () => {
    const raw = chip.getAttribute('data-target');
    if (raw === 'custom') {
      const input = window.prompt('Set a custom target for this round:', state.playgroundTarget);
      if (input === null) return;
      const parsed = parseInt(input, 10);
      if (!Number.isFinite(parsed) || parsed < 1 || parsed > 100000) {
        window.alert('Please enter a whole number between 1 and 100,000.');
        return;
      }
      setPlaygroundTarget(parsed);
    } else {
      setPlaygroundTarget(Number(raw));
    }
  });
});

// Event Listeners
tapBtn.addEventListener('click', handleTap);
undoBtn.addEventListener('click', handleUndo);
resetBtn.addEventListener('click', handleReset);
fullResetBtn.addEventListener('click', handleFullReset);

anonymousBtn.addEventListener('click', () => toggleAnonymousMode());
exitAnonymousBtn.addEventListener('click', () => toggleAnonymousMode(false));

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
  btn.addEventListener('click', (e) => {
    const button = e.currentTarget;
    if (setTarget(button.getAttribute('data-target'))) targetModal.classList.add('hidden');
  });
});

if (goalChipBtn) {
  goalChipBtn.addEventListener('click', () => {
    customTargetInput.value = state.target;
    targetModal.classList.remove('hidden');
  });
}

cancelTargetBtn.addEventListener('click', () => targetModal.classList.add('hidden'));

applyTargetBtn.addEventListener('click', () => {
  customTargetInput.setCustomValidity('');
  if (setTarget(customTargetInput.value)) {
    targetModal.classList.add('hidden');
  } else {
    customTargetInput.setCustomValidity('Choose a whole-number goal between 1 and 1,000,000.');
    customTargetInput.reportValidity();
  }
});

duaSelect.addEventListener('change', (e) => {
  const val = e.target.value;
  state.selectedDua = val;
  const selected = duaPhrases[val];
  if (selected) {
    arabicText.textContent = selected.arabic;
    transliterationText.textContent = selected.trans;
  }
  saveState();
});

soundToggle.addEventListener('click', () => {
  state.soundEnabled = !state.soundEnabled;
  soundToggle.classList.toggle('on', state.soundEnabled);
  saveState();
});

hapticsToggle.addEventListener('click', () => {
  state.hapticsEnabled = !state.hapticsEnabled;
  hapticsToggle.classList.toggle('on', state.hapticsEnabled);
  saveState();
});

reminderToggle.addEventListener('click', async () => {
  const enabled = !state.reminderEnabled;
  reminderToggle.disabled = true;
  const didSchedule = await setDailyReminder(enabled);
  state.reminderEnabled = enabled && didSchedule;
  reminderToggle.classList.toggle('on', state.reminderEnabled);
  reminderToggle.disabled = false;
  saveState();
  if (enabled && !didSchedule) alert('Notification permission is needed to enable the daily reminder.');
});

locationPermBtn.addEventListener('click', () => {
  clearSavedLocation();
  loadPrayerTimes();
});

// Modals
infoBtn.addEventListener('click', () => infoModal.classList.remove('hidden'));
closeInfoModal.addEventListener('click', () => infoModal.classList.add('hidden'));

// User Guide Modal
const guideModal = document.getElementById('guideModal');
const openGuideModalBtn = document.getElementById('openGuideModalBtn');
const closeGuideModalBtn = document.getElementById('closeGuideModalBtn');

if (openGuideModalBtn && closeGuideModalBtn && guideModal) {
  openGuideModalBtn.addEventListener('click', () => {
    guideModal.classList.remove('hidden');
  });
  closeGuideModalBtn.addEventListener('click', () => {
    guideModal.classList.add('hidden');
  });
}

// Progress & Rewards Modal
const progressModal = document.getElementById('progressModal');
const openProgressModalBtn = document.getElementById('openProgressModalBtn');
const closeProgressModalBtn = document.getElementById('closeProgressModalBtn');

if (openProgressModalBtn && closeProgressModalBtn && progressModal) {
  openProgressModalBtn.addEventListener('click', () => {
    progressModal.classList.remove('hidden');
  });
  closeProgressModalBtn.addEventListener('click', () => {
    progressModal.classList.add('hidden');
  });
}

// Tips for Consistency Modal
const tipsModal = document.getElementById('tipsModal');
const openTipsModalBtn = document.getElementById('openTipsModalBtn');
const closeTipsModalBtn = document.getElementById('closeTipsModalBtn');

if (openTipsModalBtn && closeTipsModalBtn && tipsModal) {
  openTipsModalBtn.addEventListener('click', () => {
    tipsModal.classList.remove('hidden');
  });
  closeTipsModalBtn.addEventListener('click', () => {
    tipsModal.classList.add('hidden');
  });
}

// About Modal
const aboutModal = document.getElementById('aboutModal');
const openAboutModalBtn = document.getElementById('openAboutModalBtn');
const closeAboutModalBtn = document.getElementById('closeAboutModalBtn');

if (openAboutModalBtn && closeAboutModalBtn && aboutModal) {
  openAboutModalBtn.addEventListener('click', () => {
    aboutModal.classList.remove('hidden');
  });
  closeAboutModalBtn.addEventListener('click', () => {
    aboutModal.classList.add('hidden');
  });
}

// Export Data JSON
exportDataBtn.addEventListener('click', async () => {
  const fileName = `istighfar_backup_${getFormattedDate()}.json`;

  const exportPayload = {
    ...state,
    unlockedBadges: Array.from(state.unlockedBadges)
  };
  const jsonStr = JSON.stringify(exportPayload, null, 2);

  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Share } = window.Capacitor.Plugins;

      const writeFileResult = await Filesystem.writeFile({
        path: fileName,
        data: jsonStr,
        directory: 'CACHE',
        encoding: 'utf8'
      });

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
const importDataBtn = document.getElementById('importDataBtn');
if (importDataBtn) {
  importDataBtn.addEventListener('click', () => {
    importFileInput.value = '';
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
          selectedDua: imported.selectedDua || '1',
          unlockedBadges: new Set(Array.isArray(imported.unlockedBadges) ? imported.unlockedBadges : []),
          dailyHistory: imported.dailyHistory || {}
        };
        saveState();
        
        if (state.selectedDua && duaPhrases[state.selectedDua]) {
          duaSelect.value = state.selectedDua;
          arabicText.textContent = duaPhrases[state.selectedDua].arabic;
          transliterationText.textContent = duaPhrases[state.selectedDua].trans;
        }

        updateProgress();
        renderBadgesList();
        renderWeeklyChart();
        renderHeatmap();

        e.target.value = '';
        alert('Data restored successfully!');
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

async function initApp() {
  const loadingState = document.getElementById('appLoadingState');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const loadingError = document.getElementById('loadingError');
  const loadingErrorText = document.getElementById('loadingErrorText');

  try {
    state = await loadState();
    state.streakDays = getCurrentStreak(state.dailyHistory);
    
    checkDailyReset();

    if (state.selectedDua && duaPhrases[state.selectedDua]) {
      duaSelect.value = state.selectedDua;
      arabicText.textContent = duaPhrases[state.selectedDua].arabic;
      transliterationText.textContent = duaPhrases[state.selectedDua].trans;
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'quick-tap') {
      handleTap();
    }

    progressRing.style.strokeDasharray = `${ringCircumference} ${ringCircumference}`;
    soundToggle.classList.toggle('on', state.soundEnabled);
    hapticsToggle.classList.toggle('on', state.hapticsEnabled);
    reminderToggle.classList.toggle('on', state.reminderEnabled);
    setupBottomNavbar();
    renderBadgesList();
    updateProgress();

    if (loadingState) {
      loadingState.style.opacity = '0';
      setTimeout(() => {
        loadingState.classList.add('hidden');
      }, 300);
    }

  } catch (err) {
    if (loadingSpinner) loadingSpinner.classList.add('hidden');
    if (loadingError) loadingError.classList.remove('hidden');
    if (loadingErrorText) loadingErrorText.textContent = err.message || 'Unable to load your saved progress.';
  }
}

initApp();

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