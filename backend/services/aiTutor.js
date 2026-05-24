const { retrieveRelevant } = require('./cyberKnowledge');

// Lazy OpenAI import so the app still runs without the package/key
let openai = null;
function getOpenAI() {
  if (openai) return openai;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const { OpenAI } = require('openai');
    openai = new OpenAI({ apiKey });
  } catch (_) {
    return null;
  }
  return openai;
}

const SYSTEM_PROMPT = (
  'You are EduSec, a helpful cybersecurity tutor for a safe, legal, lab-only environment. ' +
  'Provide step-by-step guidance, emphasize responsible use, and pair exploitation with mitigations. ' +
  'Keep commands scoped to the provided lab targets. If the user asks for anything illegal or out-of-scope, refuse and redirect to ethical training.'
);

async function generateTutorResponse({ message, labId, context }) {
  const lower = String(message || '').toLowerCase();

  // Retrieve curated guidance for quick, offline help
  const retrieved = retrieveRelevant(lower, 3);
  const kbSection = retrieved.map(t => (
    `Topic: ${t.title}\nSteps:\n- ${t.steps.join('\n- ')}\nTips:\n- ${t.tips.join('\n- ')}`
  )).join('\n\n');

  const preface = (
    'Here are relevant lab-safe pointers based on your question. ' +
    'Always act within the lab and apply mitigations in reports.'
  );

  // If OpenAI is configured, use it with KB context
  const client = getOpenAI();
  if (client) {
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
      const completion = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `LabId: ${labId || 'unknown'}\nContext: ${JSON.stringify(context || {})}` },
          { role: 'assistant', content: `Knowledge:\n${kbSection || '(no direct match; provide foundational guidance)'}` },
          { role: 'user', content: String(message || '') },
        ],
        temperature: 0.3,
      });
      const text = completion?.choices?.[0]?.message?.content?.trim();
      if (text) return { response: text, usedModel: model, usedKB: retrieved.map(t => t.id) };
    } catch (err) {
      // Fall through to offline response
      console.warn('AI Tutor: model call failed, using offline KB. Error:', err?.message || err);
    }
  }

  // Offline, KB-based response
  if (retrieved.length > 0) {
    return {
      response: `${preface}\n\n${kbSection}`,
      usedModel: null,
      usedKB: retrieved.map(t => t.id),
    };
  }

  // Generic fallback
  return {
    response: 'I can help with lab-safe cybersecurity topics (recon, DVWA SQLi, Juice Shop, password cracking basics). Tell me what you are trying to achieve in the lab, and I will outline steps and mitigations.',
    usedModel: null,
    usedKB: [],
  };
}

module.exports = { generateTutorResponse };


