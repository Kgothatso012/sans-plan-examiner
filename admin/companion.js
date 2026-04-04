/**
 * SANS Plan Examiner Companion System
 * Based on Claude Code's Moth companion
 * Features: Stats, Rarity, Species, Hats, Animations, Speech Bubbles
 */

(function() {
  'use strict';

  // === CONSTANTS ===
  const SPECIES = ['blob', 'cat', 'dragon', 'owl', 'penguin', 'turtle', 'ghost', 'robot', 'rabbit', 'chonk'];
  const EYES = ['·', '✦', '×', '◉', '@', '°'];
  const HATS = ['none', 'crown', 'tophat', 'halo', 'wizard', 'beanie'];
  const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
  const STAT_NAMES = ['ACCURACY', 'SPEED', 'INSIGHT', 'DILIGENCE', 'WISDOM'];

  const RARITY_WEIGHTS = { common: 60, uncommon: 25, rare: 10, epic: 4, legendary: 1 };
  const RARITY_STARS = { common: '★', uncommon: '★★', rare: '★★★', epic: '★★★★', legendary: '★★★★★' };
  const RARITY_COLORS = {
    common: '#999999',
    uncommon: '#2e7d32',
    rare: '#1565c0',
    epic: '#7b1fa2',
    legendary: '#f57c00'
  };

  // === STATE ===
  let companionState = {
    name: 'Inspector',
    species: 'blob',
    rarity: 'common',
    eye: '◉',
    hat: 'none',
    stats: {},
    hatchedAt: Date.now(),
    analysesCompleted: 0,
    violationsFound: 0,
    plansApproved: 0,
    currentBubble: null
  };

  // === RNG FUNCTIONS ===
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function() {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashString(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length)];
  }

  // === ROLL COMPANION ===
  function rollCompanion(userId) {
    const seed = userId + 'sans-examiner-2026';
    const rng = mulberry32(hashString(seed));

    // Roll rarity
    const total = Object.values(RARITY_WEIGHTS).reduce((a, b) => a + b, 0);
    let roll = rng() * total;
    let rarity = 'common';
    for (const r of RARITIES) {
      roll -= RARITY_WEIGHTS[r];
      if (roll < 0) { rarity = r; break; }
    }

    // Roll stats (floor based on rarity)
    const floor = { common: 5, uncommon: 15, rare: 25, epic: 35, legendary: 50 }[rarity];
    const stats = {};
    STAT_NAMES.forEach(stat => {
      stats[stat] = Math.min(100, floor + Math.floor(rng() * 45));
    });

    companionState = {
      ...companionState,
      species: pick(rng, SPECIES),
      rarity: rarity,
      eye: pick(rng, EYES),
      hat: rarity === 'common' ? 'none' : pick(rng, HATS),
      stats: stats,
      hatchedAt: Date.now()
    };

    return companionState;
  }

  // === RENDER COMPANION ===
  function getCompanionAppearance() {
    const { species, eye, hat, rarity } = companionState;

    const sprites = {
      blob: { body: '🟣', scale: 'scale(1.2)' },
      cat: { body: '🐱', scale: 'scale(1)' },
      dragon: { body: '🐲', scale: 'scale(1.1)' },
      owl: { body: '🦉', scale: 'scale(1)' },
      penguin: { body: '🐧', scale: 'scale(1)' },
      turtle: { body: '🐢', scale: 'scale(1)' },
      ghost: { body: '👻', scale: 'scale(1)' },
      robot: { body: '🤖', scale: 'scale(1)' },
      rabbit: { body: '🐰', scale: 'scale(1)' },
      chonk: { body: '🐹', scale: 'scale(1.2)' }
    };

    const hats = {
      none: '',
      crown: '👑',
      tophat: '🎩',
      halo: '😇',
      wizard: '🧙',
      beanie: '🧢'
    };

    return {
      sprite: sprites[species] || sprites.blob,
      hatEmoji: hats[hat] || '',
      stars: RARITY_STARS[rarity],
      color: RARITY_COLORS[rarity]
    };
  }

  function renderCompanion(container) {
    const appearance = getCompanionAppearance();
    const { body, scale } = appearance.sprite;

    container.innerHTML = `
      <div class="companion-wrapper">
        <div class="companion-bubble" id="companionBubble"></div>
        <div class="companion-sprite" style="transform: ${scale}">
          ${body}
          ${appearance.hatEmoji ? `<span class="companion-hat">${appearance.hatEmoji}</span>` : ''}
        </div>
        <div class="companion-eye">${companionState.eye}</div>
        <div class="companion-rarity" style="color: ${appearance.color}">${appearance.stars}</div>
      </div>
    `;
  }

  // === SPEECH BUBBLES ===
  const SPEECH_MESSAGES = {
    idle: [
      "Waiting for a building plan...",
      "Ready to inspect!",
      "Any plans to review?",
      "I love analyzing floor areas! 📐",
      "SANS 10400 is my specialty"
    ],
    analyzing: [
      "Reading the plan...",
      "Checking dimensions...",
      "Hmmm, let me see...",
      "Analyzing compliance..."
    ],
    success: [
      "This plan looks good! ✅",
      "Passed all checks!",
      "Clean design! 👍",
      "Ready for approval!"
    ],
    warning: [
      "Found some issues...",
      "Needs revision ⚠️",
      "A few concerns here...",
      "Check the comments"
    ],
    fail: [
      "Multiple violations found! ❌",
      "This needs work...",
      "Several issues detected",
      "Cannot approve in current state"
    ],
    celebrate: [
      "Another one approved! 🎉",
      "Great work! Approved!",
      "Another satisfied architect!",
      "Filing approved! Good job!"
    ]
  };

  function showSpeech(type, duration = 4000) {
    const bubble = document.getElementById('companionBubble');
    if (!bubble) return;

    const messages = SPEECH_MESSAGES[type] || SPEECH_MESSAGES.idle;
    const message = messages[Math.floor(Math.random() * messages.length)];

    bubble.textContent = message;
    bubble.className = 'companion-bubble show';
    bubble.dataset.type = type;

    companionState.currentBubble = setTimeout(() => {
      bubble.classList.remove('show');
    }, duration);
  }

  function cancelSpeech() {
    if (companionState.currentBubble) {
      clearTimeout(companionState.currentBubble);
    }
    const bubble = document.getElementById('companionBubble');
    if (bubble) bubble.classList.remove('show');
  }

  // === REACTION TO AI ANALYSIS ===
  function reactToAnalysis(result) {
    if (!result || !result.clauses) {
      showSpeech('idle');
      return;
    }

    const clauses = result.clauses;
    const fails = clauses.filter(c => c.status === 'fail').length;
    const warns = clauses.filter(c => c.status === 'warn').length;
    const passes = clauses.filter(c => c.status === 'pass').length;

    companionState.analysesCompleted++;

    if (fails === 0 && warns === 0) {
      companionState.plansApproved++;
      showSpeech('celebrate', 6000);
    } else if (fails === 0 && warns <= 2) {
      showSpeech('success', 5000);
    } else if (fails <= 2) {
      companionState.violationsFound += fails;
      showSpeech('warning', 5000);
    } else {
      companionState.violationsFound += fails;
      showSpeech('fail', 6000);
    }
  }

  // === STATS PANEL ===
  function renderStats() {
    const stats = companionState.stats;
    const statBars = Object.entries(stats).map(([name, value]) => `
      <div class="companion-stat">
        <div class="companion-stat-label">${name}</div>
        <div class="companion-stat-bar">
          <div class="companion-stat-fill" style="width: ${value}%"></div>
        </div>
        <div class="companion-stat-value">${value}</div>
      </div>
    `).join('');

    return `
      <div class="companion-stats-panel">
        <h4>Inspector Stats</h4>
        <div class="companion-stat-grid">${statBars}</div>
        <div class="companion-activity">
          <span>📊 ${companionState.analysesCompleted} analyses</span>
          <span>⚠️ ${companionState.violationsFound} violations</span>
          <span>✅ ${companionState.plansApproved} approved</span>
        </div>
        <div class="companion-rarity-badge" style="background: ${getCompanionAppearance().color}">
          ${companionState.rarity.toUpperCase()}
        </div>
      </div>
    `;
  }

  // === ANIMATIONS ===
  function animateBounce() {
    const sprite = document.querySelector('.companion-sprite');
    if (sprite) {
      sprite.animate([
        { transform: sprite.style.transform || 'scale(1)' },
        { transform: sprite.style.transform?.replace('scale(', 'scale(') + 'scale(1.1)' || 'scale(1.1)' },
        { transform: sprite.style.transform || 'scale(1)' }
      ], { duration: 500, iterations: 2 });
    }
  }

  function animateWave() {
    const sprite = document.querySelector('.companion-sprite');
    if (sprite) {
      sprite.animate([
        { transform: 'rotate(0deg)' },
        { transform: 'rotate(-10deg)' },
        { transform: 'rotate(10deg)' },
        { transform: 'rotate(0deg)' }
      ], { duration: 600 });
    }
  }

  // === INITIALIZE ===
  function initCompanion(containerId, userId) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('Companion container not found:', containerId);
      return;
    }

    // Roll companion based on userId
    rollCompanion(userId || 'joe-examiner');

    // Render
    renderCompanion(container);

    // Add styles
    addCompanionStyles();

    // Initial greeting
    setTimeout(() => showSpeech('idle', 5000), 1000);

    // Periodic idle animations
    setInterval(() => {
      if (Math.random() > 0.7) {
        animateBounce();
      }
    }, 8000);
  }

  function addCompanionStyles() {
    if (document.getElementById('companion-styles')) return;

    const style = document.createElement('style');
    style.id = 'companion-styles';
    style.textContent = `
      .companion-wrapper {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        font-family: var(--font-body);
      }

      .companion-bubble {
        position: absolute;
        bottom: 80px;
        right: 60px;
        background: white;
        border: 2px solid var(--tshwane-blue);
        border-radius: 16px;
        padding: 12px 16px;
        max-width: 220px;
        font-size: 0.85rem;
        color: var(--ink);
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
      }

      .companion-bubble.show {
        opacity: 1;
        transform: translateY(0);
      }

      .companion-bubble::after {
        content: '';
        position: absolute;
        bottom: -10px;
        right: 30px;
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 10px solid var(--tshwane-blue);
      }

      .companion-bubble[data-type="success"],
      .companion-bubble[data-type="celebrate"] {
        border-color: var(--success);
      }

      .companion-bubble[data-type="fail"],
      .companion-bubble[data-type="warning"] {
        border-color: var(--warning);
      }

      .companion-sprite {
        font-size: 48px;
        filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
        cursor: pointer;
        transition: transform 0.3s ease;
      }

      .companion-sprite:hover {
        transform: scale(1.15);
      }

      .companion-hat {
        position: absolute;
        top: -10px;
        right: -5px;
        font-size: 20px;
      }

      .companion-eye {
        position: absolute;
        bottom: 30px;
        right: 25px;
        font-size: 14px;
        color: var(--ink);
        font-weight: bold;
      }

      .companion-rarity {
        position: absolute;
        bottom: 10px;
        right: 20px;
        font-size: 12px;
        letter-spacing: 2px;
      }

      .companion-stats-panel {
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 16px;
        width: 240px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        z-index: 1000;
      }

      .companion-stats-panel h4 {
        margin: 0 0 12px 0;
        font-size: 0.9rem;
        color: var(--tshwane-dark);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      .companion-stat {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
      }

      .companion-stat-label {
        font-size: 0.7rem;
        color: var(--steel);
        width: 70px;
      }

      .companion-stat-bar {
        flex: 1;
        height: 8px;
        background: #eee;
        border-radius: 4px;
        overflow: hidden;
      }

      .companion-stat-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--tshwane-blue), var(--tshwane-dark));
        border-radius: 4px;
        transition: width 0.5s ease;
      }

      .companion-stat-value {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--ink);
        width: 24px;
        text-align: right;
      }

      .companion-activity {
        display: flex;
        justify-content: space-between;
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #eee;
        font-size: 0.75rem;
        color: var(--steel);
      }

      .companion-rarity-badge {
        display: block;
        text-align: center;
        color: white;
        font-size: 0.7rem;
        font-weight: 700;
        padding: 4px 8px;
        border-radius: 4px;
        margin-top: 12px;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      @keyframes companion-wiggle {
        0%, 100% { transform: rotate(0deg); }
        25% { transform: rotate(-5deg); }
        75% { transform: rotate(5deg); }
      }

      .companion-sprite.wiggling {
        animation: companion-wiggle 0.5s ease;
      }
    `;
    document.head.appendChild(style);
  }

  // === EXPORT API ===
  window.SansCompanion = {
    init: initCompanion,
    showSpeech: showSpeech,
    reactToAnalysis: reactToAnalysis,
    getState: () => companionState,
    renderStats: renderStats,
    animateWave: animateWave
  };

})();
