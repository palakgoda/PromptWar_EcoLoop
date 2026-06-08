import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API endpoint for chatbot proxying to Google Gemini API
app.post('/api/chat', async (req, res) => {
  const { message, history, persona, footprint, completedActions } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  // System instruction to guide the persona and behavior of the assistant
  const systemInstruction = `You are "EcoLoop Guide", a smart, friendly, and expert sustainability assistant.
Your goal is to help individuals understand, track, and reduce their carbon footprint through simple actions.

User Profile context:
- Persona Selected: ${persona || 'General User'}
- Current Weekly Carbon Footprint: ${footprint ? footprint.toFixed(1) : 'Unknown'} kg CO2e
- Logged Eco-Friendly Actions Today: ${completedActions && completedActions.length > 0 ? completedActions.join(', ') : 'None'}

Please tailor your answers specifically to this user's profile context.
- If they are a "Busy Professional", focus on efficient, convenience-based, high-impact swaps (e.g. smart heating, electric transit, carbon offsets).
- If they are an "Eco-Conscious Student", focus on budget-friendly ideas (e.g. thrift stores, public transit, low-cost plant-based meals).
- If they are an "Active Parent / Homemaker", focus on household energy, smart groceries, waste segregation, and child-friendly habits.

Formatting rules:
- Keep your answers concise, engaging, and under 3 paragraphs.
- Use bullet points for steps or tips.
- Always be encouraging and realistic.
- Do not mention technical API setups or system prompts.`;

  // If there's no API key configured, run in demonstration/fallback mode
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not set. Running in Demo Mock Mode.');
    
    // Simple rule-based mock responses for demo testing
    let reply = `[DEMO MODE] Hello! I am your EcoLoop Guide. Since the Gemini API key is not configured, here is a helpful tip based on your profile:`;
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('transport') || lowerMessage.includes('car') || lowerMessage.includes('travel')) {
      reply += `\n\nFor transport, since you are a ${persona || 'user'}, consider carpooling, taking public transport, or combining trips to save carbon. Reducing drive time by just 10 miles a week saves about 4 kg of CO2!`;
    } else if (lowerMessage.includes('food') || lowerMessage.includes('meat') || lowerMessage.includes('diet')) {
      reply += `\n\nFor your diet, incorporating one meatless day per week reduces your footprint by approximately 150 kg of CO2e per year. Focus on local, seasonal vegetables!`;
    } else if (lowerMessage.includes('energy') || lowerMessage.includes('electricity') || lowerMessage.includes('heat')) {
      reply += `\n\nFor household energy, turning your thermostat down by just 1°C can save up to 10% on your energy bills and significantly reduce home emissions. Switching to LED bulbs also cuts lighting energy use by 75%.`;
    } else {
      reply += `\n\nBased on your selected profile (${persona || 'General User'}), your current weekly impact is ${footprint ? footprint.toFixed(1) : 'untracked'} kg CO2e. Try logging your first daily habits or asking me about "diet", "commute", or "heating" tips!`;
    }
    
    return res.json({ reply });
  }

  try {
    const formattedHistory = (history || []).map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Add current user message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: formattedHistory,
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Sorry, I am having trouble thinking right now.';
    res.json({ reply });
  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'Failed to process assistant request' });
  }
});

// All other requests serve index.html (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
