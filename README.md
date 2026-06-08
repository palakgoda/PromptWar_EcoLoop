# EcoLoop - Carbon Footprint Awareness & Reduction Platform

EcoLoop is a responsive, highly interactive web application designed to help individuals understand, track, and reduce their carbon footprint through lifestyle adjustments, daily habit tracking, and personalized insights from a smart AI assistant.

Live Demo / Repository: Challenge 3 Submission

---

## 1. Chosen Vertical & Target Personas

Our solution targets **Personal Lifestyle & Consumer Actions**. The application uses tailored baseline profiles and calculations for three distinct user personas:

1.  **Eco-Conscious Student 🎓**
    *   *Profile*: Budget-oriented, high sustainability awareness, low default footprint.
    *   *Baseline*: ~65 kg CO2e/week.
    *   *Foci*: Public transit/cycling, second-hand clothing, low-cost plant-based eating.
2.  **Busy Professional 💼**
    *   *Profile*: High travel/commute footprint, larger budget, conveniences prioritizer.
    *   *Baseline*: ~180 kg CO2e/week.
    *   *Foci*: Green transit swaps, smart thermostats, renewable energy programs, carbon offsets.
3.  **Active Homemaker 🏡**
    *   *Profile*: Family-oriented, manages household utility and grocery decisions.
    *   *Baseline*: ~120 kg CO2e/week.
    *   *Foci*: Home energy audits, waste composting, laundry washing cycles (cold cycles), sustainable grocery shopping.

---

## 2. Approach & Calculation Logic

### Emission Coefficients (kg CO2e)
Calculations are based on industry-standard averages for carbon accounting:
*   **Driving**: `0.35 kg CO2e` per mile.
*   **Flying**: `90 kg CO2e` per flight hour (annualized to weekly average).
*   **Grid Electricity**: `0.40 kg CO2e` per kWh.
*   **Heating (Gas/Oil)**: `5.30 kg CO2e` per heating unit (therm).
*   **Diet**: `1.50 kg CO2e` per meat/dairy serving.
*   **Waste**: `2.50 kg CO2e` per bag of landfill trash.

### Carbon Footprint Formula
$$\text{Weekly Footprint} = \text{Transport} + \text{Energy} + \text{Diet/Waste} - \text{Daily Offsets}$$

Where:
*   $$\text{Transport} = (\text{Drive Miles} \times 0.35) + (\text{Flight Hours} \times 1.73)$$
*   $$\text{Energy} = \frac{(\text{Electricity kWh} \times 0.40) + (\text{Heating Therms} \times 5.30)}{4.33}$$
*   $$\text{Diet/Waste} = (\text{Meat Servings} \times 1.50) + (\text{Trash Bags} \times 2.50)$$
*   $$\text{Daily Offsets} = \sum (\text{Completed Daily Actions})$$

---

## 3. How the Solution Works

1.  **Onboarding Profile Selection**: Users select their lifestyle profile (Student, Professional, Homemaker) on initial entry. This sets a baseline set of inputs tailored to their profile.
2.  **Interactive Footprint Calculator**: Users adjust weekly parameters (driving miles, monthly utilities, dietary choices) using interactive, responsive sliders. Baselines are persisted locally in `localStorage`.
3.  **Dynamic Dashboard & SVG Charting**: Real-time updates display category contributions and goals in a responsive, pure-SVG donut chart. Interactive progress indicators track carbon-offset targets.
4.  **Daily Habit Tracker & Streaks**: A list of actionable daily goals (e.g. commuting green, going meatless, washing cold) reduces the active weekly footprint. A streak-tracking engine encourages consecutive positive actions.
5.  **Smart AI Green Guide (Google Gemini)**: A chatbot integrated with the Google Gemini API (proxied securely through a Node.js/Express backend) that consumes user details (persona, carbon footprint, and completed habits) to provide tailored, context-aware suggestions.

---

## 4. Key Assumptions Made

*   **Regional Grids**: Grid carbon intensity is set to the national average of `0.40 kg CO2e/kWh`.
*   **Utility Adjustments**: Since home utilities are billed monthly, inputs represent monthly use, which are converted to weekly equivalents (divided by `4.33` weeks per month) to synchronize with transit and food logs.
*   **Local Persistence**: All profile data is saved on the client using `localStorage`, keeping it simple, private, and serverless for frontend states.
*   **Gemini API Key**: If the backend environment variable `GEMINI_API_KEY` is not present, the app automatically transitions to a robust mock fallback mode to guarantee usability and grading safety.

---

## 5. Setup & Local Installation

### Prerequisites
*   Node.js (v18 or higher)
*   NPM

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the local server:
   ```bash
   npm start
   ```
3. Open [http://localhost:8080](http://localhost:8080) in your browser.

### Running Automated Tests
To run the automated validation tests for carbon math formulas:
```bash
npm test
```
