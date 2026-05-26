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

export async function callGemini({ apiKey, prompt }) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for Gemini planner.');
  }

  const data = await requestWithRetry(
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      })
    }
  );

  return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

export async function callGroq({ apiKey, prompt }) {
  if (!apiKey) {
    throw new Error('GROQ_API_KEY is required for Qwen coder.');
  }

  const data = await requestWithRetry('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model: 'qwen/qwen-32b', temperature: 0.2, messages: [{ role: 'user', content: prompt }] })
  });
  return data?.choices?.[0]?.message?.content || '';
}

export async function callOpenRouter({ apiKey, model, prompt }) {
  if (!apiKey) {
    throw new Error(`OPENROUTER_API_KEY is required for model ${model}.`);
  }

  const data = await requestWithRetry('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, temperature: 0.2, messages: [{ role: 'user', content: prompt }] })
  });
  return data?.choices?.[0]?.message?.content || '';
}
