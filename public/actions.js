// --- Daily Eco Actions & Offsets ---

export const GREEN_ACTIONS = [
  {
    id: 'transit',
    title: 'Public Transit or Cycling',
    emoji: '🚲',
    saving: 4.5, // kg CO2e saved per trip
    category: 'transport'
  },
  {
    id: 'meatless',
    title: 'Plant-Based Meals Only',
    emoji: '🥗',
    saving: 3.5, // kg CO2e saved per day
    category: 'diet'
  },
  {
    id: 'unplug',
    title: 'Power Conservation',
    emoji: '💡',
    saving: 2.0, // kg CO2e saved (adjusting thermostat, turning off standby)
    category: 'energy'
  },
  {
    id: 'recycle',
    title: 'Zero Waste & Recycling',
    emoji: '♻️',
    saving: 1.2, // kg CO2e saved by composting, packaging avoidances
    category: 'diet'
  },
  {
    id: 'coldwash',
    title: 'Eco Laundry & Cold Wash',
    emoji: '👕',
    saving: 1.5, // kg CO2e saved by washing on cold & line drying
    category: 'energy'
  }
];

/**
 * Loads logged actions for a specific date (default today).
 */
export function getLoggedActions(dateStr = getTodayString()) {
  const data = localStorage.getItem(`actions_${dateStr}`);
  return data ? JSON.parse(data) : [];
}

/**
 * Saves logged actions for a specific date.
 */
export function saveLoggedActions(actions, dateStr = getTodayString()) {
  localStorage.setItem(`actions_${dateStr}`, JSON.stringify(actions));
}

/**
 * Gets a clean date string (YYYY-MM-DD) based on local timezone.
 */
export function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Gets the date string for yesterday.
 */
export function getYesterdayString() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Calculates the total carbon saved today by looking up current active actions.
 * @param {Array<string>} activeActionIds - List of completed action IDs today
 */
export function calculateSavedCarbon(activeActionIds) {
  return activeActionIds.reduce((total, id) => {
    const action = GREEN_ACTIONS.find(a => a.id === id);
    return total + (action ? action.saving : 0);
  }, 0);
}

/**
 * Updates streak info in localStorage.
 * If user logs at least one action, checks streak continuity.
 */
export function updateStreak(activeActionCount) {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  
  let streak = parseInt(localStorage.getItem('streak_count') || '0', 10);
  let lastActiveDate = localStorage.getItem('last_active_date') || '';

  // Calculate streak continuity
  if (activeActionCount > 0) {
    if (lastActiveDate !== today) {
      if (lastActiveDate === yesterday) {
        streak += 1;
      } else if (lastActiveDate === '') {
        streak = 1;
      } else {
        // Gap of > 1 day, reset streak to 1
        streak = 1;
      }
      localStorage.setItem('streak_count', streak.toString());
      localStorage.setItem('last_active_date', today);
    }
  } else {
    // If they untoggle everything today, check if they were active yesterday to preserve streak,
    // otherwise if today was their only streak day, it resets.
    if (lastActiveDate === today) {
      // Revert streak
      localStorage.setItem('last_active_date', yesterday);
      streak = Math.max(0, streak - 1);
      localStorage.setItem('streak_count', streak.toString());
    }
  }

  return streak;
}

/**
 * Validate and retrieve current active streak.
 */
export function getActiveStreak() {
  const today = getTodayString();
  const yesterday = getYesterdayString();
  const lastActiveDate = localStorage.getItem('last_active_date') || '';
  let streak = parseInt(localStorage.getItem('streak_count') || '0', 10);

  // If last activity is older than yesterday, streak has broken
  if (lastActiveDate && lastActiveDate !== today && lastActiveDate !== yesterday) {
    streak = 0;
    localStorage.setItem('streak_count', '0');
  }

  return streak;
}
