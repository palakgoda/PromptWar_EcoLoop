// --- Main Application Orchestrator ---

import { PERSONA_BASELINES, calculateFootprint, renderBreakdownChart } from './tracker.js';
import { GREEN_ACTIONS, getLoggedActions, saveLoggedActions, calculateSavedCarbon, updateStreak, getActiveStreak } from './actions.js';
import { initAssistant } from './assistant.js';

// Application State
const state = {
  persona: localStorage.getItem('user_persona') || '',
  inputs: {
    driveMiles: 100,
    flightHours: 10,
    electricity: 300,
    heating: 40,
    meatServings: 14,
    wasteBags: 2
  },
  baselineFootprint: 0,
  savedCarbonToday: 0,
  currentWeeklyFootprint: 0,
  completedActions: [],
  streak: 0
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // Check if persona onboarding is needed
  if (!state.persona) {
    showOnboarding(true);
  } else {
    showOnboarding(false);
    loadUserSettings();
    renderAll();
  }

  // Initialize general UI Event Listeners
  setupEventListeners();
  
  // Initialize AI assistant proxy
  initAssistant(state);
}

/**
 * Toggles onboarding overlay view.
 */
function showOnboarding(show) {
  const overlay = document.getElementById('onboarding-overlay');
  if (overlay) {
    overlay.style.display = show ? 'flex' : 'none';
  }
}

/**
 * Loads baseline inputs from selected persona or localStorage.
 */
function loadUserSettings() {
  state.persona = localStorage.getItem('user_persona') || '';
  
  // Load custom calculator inputs if saved, else fallback to persona default defaults
  const savedInputs = localStorage.getItem('calculator_inputs');
  if (savedInputs) {
    state.inputs = JSON.parse(savedInputs);
  } else if (state.persona && PERSONA_BASELINES[state.persona]) {
    const defaults = PERSONA_BASELINES[state.persona];
    state.inputs = {
      driveMiles: defaults.driveMiles,
      flightHours: defaults.flightHours,
      electricity: defaults.electricity,
      heating: defaults.heating,
      meatServings: defaults.meatServings,
      wasteBags: defaults.wasteBags
    };
  }

  // Load today's habits
  state.completedActions = getLoggedActions();
  state.savedCarbonToday = calculateSavedCarbon(state.completedActions);
  
  // Fetch active streak
  state.streak = getActiveStreak();
}

/**
 * Sets up listeners for navigation, sliders, and form submittals.
 */
function setupEventListeners() {
  // Onboarding Selection Cards
  const cards = document.querySelectorAll('.persona-card');
  const startBtn = document.getElementById('start-btn');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => {
        c.classList.remove('selected');
        c.setAttribute('aria-checked', 'false');
      });
      card.classList.add('selected');
      card.setAttribute('aria-checked', 'true');
      if (startBtn) startBtn.removeAttribute('disabled');
    });
  });

  // Start Button Click
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const selected = document.querySelector('.persona-card.selected');
      if (selected) {
        const persona = selected.getAttribute('data-persona');
        localStorage.setItem('user_persona', persona);
        
        // Reset custom inputs so persona baseline defaults load
        localStorage.removeItem('calculator_inputs');
        
        showOnboarding(false);
        loadUserSettings();
        renderAll();
      }
    });
  }

  // Reset Persona Button
  const resetBtn = document.getElementById('reset-persona-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      localStorage.removeItem('user_persona');
      localStorage.removeItem('calculator_inputs');
      showOnboarding(true);
    });
  }

  // SPA Navigation Tabs
  const navItems = document.querySelectorAll('.nav-item');
  const panels = document.querySelectorAll('.tab-panel');

  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const tabName = item.getAttribute('data-tab');
      
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      panels.forEach(panel => {
        if (panel.id === `tab-${tabName}`) {
          panel.classList.add('active');
          panel.removeAttribute('hidden');
        } else {
          panel.classList.remove('active');
          panel.setAttribute('hidden', 'true');
        }
      });
    });
  });

  // Redirect link on dashboard to Assistant tab
  const askBtn = document.getElementById('go-to-assistant-btn');
  if (askBtn) {
    askBtn.addEventListener('click', () => {
      const assistantTabBtn = document.getElementById('btn-tab-assistant');
      if (assistantTabBtn) assistantTabBtn.click();
    });
  }

  // Bidirectional slider controls logic
  const numericInputs = [
    { slider: 'input-drive-miles', num: 'input-drive-miles-num', key: 'driveMiles' },
    { slider: 'input-flight-hours', num: 'input-flight-hours-num', key: 'flightHours' },
    { slider: 'input-electricity', num: 'input-electricity-num', key: 'electricity' },
    { slider: 'input-heating', num: 'input-heating-num', key: 'heating' },
    { slider: 'input-meat-servings', num: 'input-meat-servings-num', key: 'meatServings' },
    { slider: 'input-waste-bags', num: 'input-waste-bags-num', key: 'wasteBags' }
  ];

  numericInputs.forEach(group => {
    const sEl = document.getElementById(group.slider);
    const nEl = document.getElementById(group.num);

    if (sEl && nEl) {
      // Sync slider change to text box
      sEl.addEventListener('input', (e) => {
        nEl.value = e.target.value;
        state.inputs[group.key] = parseFloat(e.target.value) || 0;
      });

      // Sync text box change to slider
      nEl.addEventListener('change', (e) => {
        let val = parseFloat(e.target.value) || 0;
        const min = parseFloat(sEl.min);
        const max = parseFloat(sEl.max);

        // Clamp values
        if (val < min) val = min;
        if (val > max) val = max;

        nEl.value = val;
        sEl.value = val;
        state.inputs[group.key] = val;
      });
    }
  });

  // Save Calculator Button
  const saveCalcBtn = document.getElementById('save-calc-btn');
  if (saveCalcBtn) {
    saveCalcBtn.addEventListener('click', () => {
      localStorage.setItem('calculator_inputs', JSON.stringify(state.inputs));
      
      // Visual feedback on button
      const oldText = saveCalcBtn.textContent;
      saveCalcBtn.textContent = 'Baselines Saved! ✓';
      saveCalcBtn.style.background = 'oklch(0.74 0.16 142)';
      
      setTimeout(() => {
        saveCalcBtn.textContent = oldText;
        saveCalcBtn.style.background = '';
      }, 2000);

      renderAll();
    });
  }
}

/**
 * Calculates current baseline, savings, and updates all DOM elements.
 */
function renderAll() {
  // 1. Carbon Math
  const breakdown = calculateFootprint(state.inputs);
  state.baselineFootprint = breakdown.total;
  
  // Net footprint = baseline minus daily offsets
  state.currentWeeklyFootprint = Math.max(0, state.baselineFootprint - state.savedCarbonToday);

  // 2. Persona Display Updates
  const displayPersona = document.getElementById('display-persona');
  if (displayPersona) {
    displayPersona.textContent = formatPersonaName(state.persona);
  }

  const userGreeting = document.getElementById('user-greeting');
  if (userGreeting) {
    userGreeting.textContent = `Hello, ${formatPersonaName(state.persona)}!`;
  }

  // 3. Header Badges Updates
  const headerFootprint = document.getElementById('header-footprint-val');
  if (headerFootprint) {
    headerFootprint.textContent = `${state.currentWeeklyFootprint.toFixed(1)} kg`;
  }

  const headerStreak = document.getElementById('header-streak-val');
  if (headerStreak) {
    headerStreak.textContent = `${state.streak} ${state.streak === 1 ? 'day' : 'days'}`;
  }

  // 4. Goal Progress circular ring
  // Goal: reduce by 20% compared to baseline or a standard baseline
  const goalTarget = state.baselineFootprint * 0.8; // 20% reduction target
  const savedPercentage = state.baselineFootprint > 0 
    ? Math.min(100, (state.savedCarbonToday / state.baselineFootprint) * 100)
    : 0;

  const goalPercentEl = document.getElementById('goal-percent');
  if (goalPercentEl) {
    goalPercentEl.textContent = `${savedPercentage.toFixed(0)}%`;
  }

  const goalTargetEl = document.getElementById('goal-target-val');
  if (goalTargetEl) {
    goalTargetEl.textContent = `${goalTarget.toFixed(1)} kg`;
  }

  const savedCarbonEl = document.getElementById('saved-carbon-val');
  if (savedCarbonEl) {
    savedCarbonEl.textContent = `${state.savedCarbonToday.toFixed(1)} kg`;
  }

  // Adjust circular ring dashoffset
  const ring = document.querySelector('.ring-fg');
  if (ring) {
    const circumference = 534; // 2 * PI * 85
    const offset = circumference - (savedPercentage / 100) * circumference;
    ring.style.strokeDashoffset = offset.toString();
  }

  // 5. SVG Category Breakdown Chart
  const chartContainer = document.getElementById('breakdown-svg-container');
  renderBreakdownChart(chartContainer, breakdown);

  // 6. Update Calculator Slider Values visually
  updateCalculatorUIInputs();

  // 7. Render Daily Habits list
  renderHabitsList();

  // 8. Display dynamic localized tip
  renderDynamicTip();

  // 9. Update Today's Highlight logs
  renderTodayHighlights();
}

function updateCalculatorUIInputs() {
  const mapping = [
    { id: 'input-drive-miles', val: state.inputs.driveMiles },
    { id: 'input-drive-miles-num', val: state.inputs.driveMiles },
    { id: 'input-flight-hours', val: state.inputs.flightHours },
    { id: 'input-flight-hours-num', val: state.inputs.flightHours },
    { id: 'input-electricity', val: state.inputs.electricity },
    { id: 'input-electricity-num', val: state.inputs.electricity },
    { id: 'input-heating', val: state.inputs.heating },
    { id: 'input-heating-num', val: state.inputs.heating },
    { id: 'input-meat-servings', val: state.inputs.meatServings },
    { id: 'input-meat-servings-num', val: state.inputs.meatServings },
    { id: 'input-waste-bags', val: state.inputs.wasteBags },
    { id: 'input-waste-bags-num', val: state.inputs.wasteBags }
  ];

  mapping.forEach(item => {
    const el = document.getElementById(item.id);
    if (el) el.value = item.val;
  });
}

function renderHabitsList() {
  const container = document.getElementById('habits-list');
  if (!container) return;

  container.innerHTML = '';

  GREEN_ACTIONS.forEach(action => {
    const isCompleted = state.completedActions.includes(action.id);
    
    const row = document.createElement('div');
    row.className = 'habit-row';
    
    row.innerHTML = `
      <div class="habit-info">
        <span class="habit-emoji">${action.emoji}</span>
        <div>
          <span class="habit-title">${action.title}</span>
          <div class="habit-saving">Saves ${action.saving} kg CO2e / day</div>
        </div>
      </div>
      <div class="habit-action-wrapper">
        <button type="button" class="toggle-btn ${isCompleted ? 'checked' : ''}" 
                aria-pressed="${isCompleted ? 'true' : 'false'}" 
                data-id="${action.id}"
                aria-label="Toggle ${action.title}">
          ${isCompleted ? '✓' : '+'}
        </button>
      </div>
    `;

    // Toggle click listener
    row.querySelector('.toggle-btn').addEventListener('click', (e) => {
      const btn = e.currentTarget;
      const actionId = btn.getAttribute('data-id');
      
      if (state.completedActions.includes(actionId)) {
        state.completedActions = state.completedActions.filter(id => id !== actionId);
        btn.classList.remove('checked');
        btn.setAttribute('aria-pressed', 'false');
        btn.textContent = '+';
      } else {
        state.completedActions.push(actionId);
        btn.classList.add('checked');
        btn.setAttribute('aria-pressed', 'true');
        btn.textContent = '✓';
      }

      // Save to localStorage & update state
      saveLoggedActions(state.completedActions);
      state.savedCarbonToday = calculateSavedCarbon(state.completedActions);
      state.streak = updateStreak(state.completedActions.length);
      
      renderAll();
    });

    container.appendChild(row);
  });
}

function renderTodayHighlights() {
  const transitEl = document.getElementById('stat-transit');
  const energyEl = document.getElementById('stat-energy');
  const dietEl = document.getElementById('stat-diet');

  if (transitEl) {
    const isTransit = state.completedActions.includes('transit');
    transitEl.textContent = isTransit ? 'Saves 4.5 kg CO2e today (Biked/took transit)' : 'No green transit logged today';
  }

  if (energyEl) {
    const hasEnergy = state.completedActions.includes('unplug') || state.completedActions.includes('coldwash');
    if (hasEnergy) {
      let saved = 0;
      if (state.completedActions.includes('unplug')) saved += 2.0;
      if (state.completedActions.includes('coldwash')) saved += 1.5;
      energyEl.textContent = `Saves ${saved.toFixed(1)} kg CO2e today`;
    } else {
      energyEl.textContent = 'No energy habits logged today';
    }
  }

  if (dietEl) {
    const hasDiet = state.completedActions.includes('meatless') || state.completedActions.includes('recycle');
    if (hasDiet) {
      let saved = 0;
      if (state.completedActions.includes('meatless')) saved += 3.5;
      if (state.completedActions.includes('recycle')) saved += 1.2;
      dietEl.textContent = `Saves ${saved.toFixed(1)} kg CO2e today`;
    } else {
      dietEl.textContent = 'No meal swaps logged today';
    }
  }
}

function renderDynamicTip() {
  const tipEl = document.getElementById('dashboard-tip');
  if (!tipEl) return;

  let tipText = '';
  const baselineVal = state.baselineFootprint;

  if (state.persona === 'student') {
    if (state.inputs.flightHours > 4) {
      tipText = "Flights represent your largest impact. Reducing even one long-distance flight or opting for direct routes cuts emissions dramatically.";
    } else if (baselineVal < 60) {
      tipText = "Your student habits are highly carbon-efficient! Take it further by exploring zero-waste swaps, like swapping plastics for reusables.";
    } else {
      tipText = "Opting for a local plant-based diet (even 3 days a week) is the easiest, lowest-cost way to scale down your footprint.";
    }
  } else if (state.persona === 'professional') {
    if (state.inputs.driveMiles > 150) {
      tipText = "Your high weekly mileage is your main emission driver. Carpooling or driving an EV can cut transit footprint by 50% or more.";
    } else if (state.inputs.electricity > 400) {
      tipText = "Your home energy footprint is elevated. Sourcing power from local community solar programs cuts household footprint without equipment swaps.";
    } else {
      tipText = "High-efficiency heating settings (e.g. lowering temp by 1.5°C during sleep) cuts winter fuel footprints by up to 15%.";
    }
  } else if (state.persona === 'homemaker') {
    if (state.inputs.wasteBags > 3) {
      tipText = "Reducing food waste and composting scraps keeps organic items out of landfills, eliminating heavy methane source footprints.";
    } else if (state.inputs.meatServings > 10) {
      tipText = "Reducing beef and dairy grocery lines reduces agricultural water and land footprints. Try switching to oat or almond milks.";
    } else {
      tipText = "Washing laundry in cold cycles avoids heating elements, reducing washer carbon intensity by up to 75% per load.";
    }
  } else {
    tipText = "Add details to the calculator or habits tab to start tracking carbon offsets.";
  }

  tipEl.textContent = tipText;
}

function formatPersonaName(name) {
  if (name === 'student') return 'Eco Student';
  if (name === 'professional') return 'Busy Professional';
  if (name === 'homemaker') return 'Homemaker';
  return name;
}
export { state };
