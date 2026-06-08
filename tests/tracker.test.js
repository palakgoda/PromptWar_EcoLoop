import test from 'node:test';
import assert from 'node:assert';
import { calculateFootprint, PERSONA_BASELINES, EMISSION_FACTORS } from '../public/tracker.js';
import { calculateSavedCarbon } from '../public/actions.js';

test('Carbon Footprint Calculation Formula Accuracy', (t) => {
  const sampleInputs = {
    driveMiles: 100,
    flightHours: 5,
    electricity: 300,
    heating: 40,
    meatServings: 10,
    wasteBags: 2
  };

  const results = calculateFootprint(sampleInputs);

  // Expected transportation emissions
  // (driveMiles * driveMileFactor) + (flightHours * flightHourFactor)
  // (100 * 0.35) + (5 * 90 / 52) = 35 + 8.6538 = 43.6538
  const expectedTransport = (100 * EMISSION_FACTORS.driveMile) + (5 * EMISSION_FACTORS.flightHour);
  assert.ok(Math.abs(results.transport - expectedTransport) < 0.001);

  // Expected energy emissions
  // ((electricity * electricityFactor) / 4.33) + ((heating * heatingFactor) / 4.33)
  // ((300 * 0.4) / 4.33) + ((40 * 5.3) / 4.33) = (120 + 212) / 4.33 = 332 / 4.33 = 76.674
  const expectedEnergy = ((300 * EMISSION_FACTORS.electricityKwh) + (40 * EMISSION_FACTORS.heatingTherm)) / 4.33;
  assert.ok(Math.abs(results.energy - expectedEnergy) < 0.001);

  // Expected diet & waste emissions
  // (meatServings * meatFactor) + (wasteBags * wasteFactor)
  // (10 * 1.5) + (2 * 2.5) = 15 + 5 = 20
  const expectedDiet = (10 * EMISSION_FACTORS.meatServing) + (2 * EMISSION_FACTORS.wasteBag);
  assert.ok(Math.abs(results.diet - expectedDiet) < 0.001);

  // Expected total
  const expectedTotal = expectedTransport + expectedEnergy + expectedDiet;
  assert.ok(Math.abs(results.total - expectedTotal) < 0.001);
});

test('Persona Baselines Data Configuration', (t) => {
  assert.ok(PERSONA_BASELINES.student, 'Student baseline configuration must exist');
  assert.ok(PERSONA_BASELINES.professional, 'Professional baseline configuration must exist');
  assert.ok(PERSONA_BASELINES.homemaker, 'Homemaker baseline configuration must exist');

  // Verify baseline fields
  const fields = ['driveMiles', 'flightHours', 'electricity', 'heating', 'meatServings', 'wasteBags'];
  fields.forEach(field => {
    assert.strictEqual(typeof PERSONA_BASELINES.student[field], 'number');
    assert.strictEqual(typeof PERSONA_BASELINES.professional[field], 'number');
    assert.strictEqual(typeof PERSONA_BASELINES.homemaker[field], 'number');
  });
});

test('Daily Action Offsets Calculations', (t) => {
  // Test empty list
  assert.strictEqual(calculateSavedCarbon([]), 0);

  // Test selected items
  // transit = 4.5, meatless = 3.5, unplug = 2.0
  const selectedActionIds = ['transit', 'meatless', 'unplug'];
  const expectedSaving = 4.5 + 3.5 + 2.0; // 10.0
  assert.strictEqual(calculateSavedCarbon(selectedActionIds), expectedSaving);
});
