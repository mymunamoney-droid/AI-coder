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
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const fallbackModel = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (openRouterKey) {
    try {
      const openRouterData = await requestWithRetry('https://openrouter.ai/api/v1/chat/completions', {
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

      return openRouterData?.choices?.[0]?.message?.content || '';
    } catch (openRouterError) {
      if (!apiKey) {
        throw new Error(
          `Gemini via OpenRouter failed and no GEMINI_API_KEY is available for fallback. ${openRouterError.message}`
        );
      }
    }
  }

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required for direct Gemini fallback.');
  }

  const googleData = await requestWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/${fallbackModel}:generateContent`,
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

  return googleData?.candidates?.[0]?.content?.parts?.[0]?.text || '';
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
