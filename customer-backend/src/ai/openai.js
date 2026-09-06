// OpenAI adapter (BYO key — key lives only in this backend's env).
// OPENAI_BASE_URL override exists for tests and OpenAI-compatible proxies.
export async function generateWithOpenAI({ apiKey, model, systemPrompt, userText }) {
  const base = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
  const response = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 300,
      temperature: 0.7,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userText },
      ],
    }),
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI API error ${response.status}: ${detail.slice(0, 200)}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("OpenAI returned an empty reply");
  return text;
}
