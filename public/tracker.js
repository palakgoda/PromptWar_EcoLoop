// --- Carbon Footprint Math & Constants ---

export const EMISSION_FACTORS = {
  driveMile: 0.35,       // kg CO2e per mile driven
  flightHour: 90 / 52,   // kg CO2e per flight hour (annual divided by weeks)
  electricityKwh: 0.4,   // kg CO2e per kWh of grid electricity
  heatingTherm: 5.3,     // kg CO2e per therm of gas/heating fuel
  meatServing: 1.5,      // average kg CO2e per meal serving (beef/pork/chicken/dairy blend)
  wasteBag: 2.5          // kg CO2e per bag of landfill waste
};

// Base baselines for each persona
export const PERSONA_BASELINES = {
  student: {
    driveMiles: 30,
    flightHours: 2,
    electricity: 120,
    heating: 15,
    meatServings: 5,
    wasteBags: 1
  },
  professional: {
    driveMiles: 220,
    flightHours: 35,
    electricity: 450,
    heating: 55,
    meatServings: 18,
    wasteBags: 3
  },
  homemaker: {
    driveMiles: 90,
    flightHours: 6,
    electricity: 350,
    heating: 45,
    meatServings: 12,
    wasteBags: 4
  }
};

/**
 * Calculates the weekly carbon footprint in kg CO2e broken down by category.
 */
export function calculateFootprint(inputs) {
  const transport = 
    (inputs.driveMiles * EMISSION_FACTORS.driveMile) + 
    (inputs.flightHours * EMISSION_FACTORS.flightHour);

  // Divide monthly utility numbers by 4.33 to get weekly equivalent
  const weeklyElectricity = (inputs.electricity * EMISSION_FACTORS.electricityKwh) / 4.33;
  const weeklyHeating = (inputs.heating * EMISSION_FACTORS.heatingTherm) / 4.33;
  const energy = weeklyElectricity + weeklyHeating;

  const diet = 
    (inputs.meatServings * EMISSION_FACTORS.meatServing) + 
    (inputs.wasteBags * EMISSION_FACTORS.wasteBag);

  const total = transport + energy + diet;

  return {
    transport,
    energy,
    diet,
    total
  };
}

/**
 * Renders a premium, responsive dynamic SVG Donut Chart for footprint breakdown.
 * @param {HTMLElement} container - Target container element
 * @param {Object} breakdown - Category footprint values {transport, energy, diet}
 */
export function renderBreakdownChart(container, breakdown) {
  if (!container) return;

  const categories = [
    { name: 'Transportation', value: breakdown.transport, color: 'var(--secondary)' },
    { name: 'Home Energy', value: breakdown.energy, color: 'var(--accent)' },
    { name: 'Diet & Waste', value: breakdown.diet, color: 'var(--primary)' }
  ];

  const total = breakdown.total || 0.001; // Avoid division by zero
  
  // Clear previous elements
  container.innerHTML = '';
  
  // Create SVG element
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '240');
  svg.setAttribute('viewBox', '0 0 240 240');
  svg.style.display = 'block';
  svg.style.margin = '0 auto';

  let accumulatedPercent = 0;
  const radius = 70;
  const cx = 120;
  const cy = 120;
  const circumference = 2 * Math.PI * radius; // ~439.8

  categories.forEach(cat => {
    const percent = cat.value / total;
    if (percent <= 0) return;

    const dashArray = `${percent * circumference} ${circumference}`;
    // Shift rotation so segment starts where previous segment ended
    const dashOffset = `${-accumulatedPercent * circumference}`;

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', cx.toString());
    circle.setAttribute('cy', cy.toString());
    circle.setAttribute('r', radius.toString());
    circle.setAttribute('fill', 'transparent');
    circle.setAttribute('stroke', cat.color);
    circle.setAttribute('stroke-width', '24');
    circle.setAttribute('stroke-dasharray', dashArray);
    circle.setAttribute('stroke-dashoffset', dashOffset);
    circle.setAttribute('transform', 'rotate(-90 120 120)'); // Start from top
    
    // Add accessibility descriptions
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${cat.name}: ${(percent * 100).toFixed(1)}% (${cat.value.toFixed(1)} kg)`;
    circle.appendChild(title);

    svg.appendChild(circle);
    accumulatedPercent += percent;
  });

  // Inner center text (total footprint in kg)
  const centerText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerText.setAttribute('x', cx.toString());
  centerText.setAttribute('y', (cy - 5).toString());
  centerText.setAttribute('text-anchor', 'middle');
  centerText.setAttribute('fill', 'var(--text-main)');
  centerText.style.fontFamily = 'var(--font-display)';
  centerText.style.fontWeight = '800';
  centerText.style.fontSize = '1.6rem';
  centerText.textContent = `${total.toFixed(0)}`;

  const centerSubtext = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  centerSubtext.setAttribute('x', cx.toString());
  centerSubtext.setAttribute('y', (cy + 18).toString());
  centerSubtext.setAttribute('text-anchor', 'middle');
  centerSubtext.setAttribute('fill', 'var(--text-muted)');
  centerSubtext.style.fontFamily = 'var(--font-family)';
  centerSubtext.style.fontSize = '0.75rem';
  centerSubtext.style.textTransform = 'uppercase';
  centerSubtext.textContent = 'kg CO2e/wk';

  svg.appendChild(centerText);
  svg.appendChild(centerSubtext);
  container.appendChild(svg);

  // Update Legend UI
  const legendContainer = document.getElementById('chart-legend');
  if (legendContainer) {
    legendContainer.innerHTML = '';
    categories.forEach(cat => {
      const share = ((cat.value / total) * 100).toFixed(0);
      const item = document.createElement('div');
      item.className = 'legend-item';
      item.innerHTML = `
        <span class="legend-color" style="background: ${cat.color}"></span>
        <span>${cat.name} (${share}%)</span>
      `;
      legendContainer.appendChild(item);
    });
  }
}
