const TIMEOUT_MS = 120000;
const DEFAULT_RETRIES = 2;

async function requestWithRetry(url, options, retries = DEFAULT_RETRIES) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const bodyText = await res.text();
        throw new Error(`API error ${res.status}: ${bodyText || 'No error body returned'}`);
      }

      return await res.json();
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;

      if (attempt === retries) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

export async function callGemini({ prompt }) {
  const openRouterKey = process.env.OPENROUTER_API_KEY;

  if (!openRouterKey) {
    throw new Error('OPENROUTER_API_KEY is required for Gemini planner via OpenRouter.');
  }

  const data = await requestWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openRouterKey}`
    },
    body: JSON.stringify({
      model: 'google/gemini-3.5-flash',
      temperature: 0.2,
      messages: [{ role: 'user', content: prompt }]
    })
  });

  return data?.choices?.[0]?.message?.content || '';
}

export async function callGroq({ apiKey, prompt }) {
  const data = await requestWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'qwen/qwen-32b', temperature: 0.2, messages: [{ role: 'user', content: prompt }] })
  });
  return data?.choices?.[0]?.message?.content || '';
}

export async function callOpenRouter({ apiKey, model, prompt }) {
  const data = await requestWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'user', content: prompt }] })
  });
  return data?.choices?.[0]?.message?.content || '';
}
