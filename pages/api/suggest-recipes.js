/**
 * POST /api/suggest-recipes
 * Body: { ingredients: string[] }
 * Returns: { ideas: string[] } - 6-8 recipe name ideas (e.g. "Tomato soup", "10 min tomato salad")
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const { ingredients = [] } = req.body;
    const list = (Array.isArray(ingredients) ? ingredients : []).slice(0, 15).join(', ');
    if (!list) {
      return res.status(200).json({ ideas: [] });
    }

    const prompt = `Given these pantry ingredients: ${list}.
Suggest 6 to 8 specific recipe names or short ideas that use these ingredients. Include variety: quick (10 min), simple, one delicacy-style dish, and one high-protein option. Examples: "Tomato soup", "10 min garlic pasta", "Creamy tomato pasta", "High-protein lentil curry".
Reply with ONLY a JSON object: { "ideas": ["Recipe 1", "Recipe 2", ...] }`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      return res.status(response.status).json({ ideas: [] });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(200).json({ ideas: [] });
    }

    const jsonStr = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const parsed = JSON.parse(jsonStr);
    const ideas = Array.isArray(parsed.ideas) ? parsed.ideas.slice(0, 8) : [];
    return res.status(200).json({ ideas });
  } catch (e) {
    console.error('suggest-recipes error:', e);
    return res.status(200).json({ ideas: [] });
  }
}
