/**
 * POST /api/generate-recipe
 * Body: {
 *   ingredients: Array<{ name, quantity?, unit?, useAmount?, useUnit?, replaceWith? }>,
 *   servings?: number,
 *   style?: string,   // e.g. "simple, 10 min, delicacy, high protein"
 *   recipeFocus?: string  // e.g. "Tomato soup"
 * }
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured. Add OPENAI_API_KEY to .env.local' });
  }

  try {
    const { ingredients = [], servings = 4, style = '', recipeFocus = '' } = req.body;
    if (!Array.isArray(ingredients) || ingredients.length === 0) {
      return res.status(400).json({ error: 'Provide at least one ingredient' });
    }

    const parts = [];
    ingredients.slice(0, 20).forEach((ing) => {
      if (typeof ing === 'string') {
        parts.push(ing);
        return;
      }
      const name = ing.replaceWith ? `(${ing.name} replaced with ${ing.replaceWith})` : ing.name;
      if (ing.useAmount != null && ing.useAmount !== '' && Number(ing.useAmount) > 0) {
        const u = ing.useUnit || ing.unit || 'unit';
        parts.push(`${name}: use only ${ing.useAmount} ${u}`);
      } else {
        parts.push(name);
      }
    });
    const ingredientList = parts.join(', ');
    const styleNote = style ? ` Style: ${style}.` : '';
    const focusNote = recipeFocus ? ` The recipe must be: "${recipeFocus}".` : '';

    const prompt = `You are a helpful chef. Generate a single recipe using ONLY these ingredients (respect amounts and replacements): ${ingredientList}.
Target ${Number(servings) || 4} servings.${styleNote}${focusNote}
Respond with ONLY a valid JSON object (no markdown, no code block) with this exact structure:
{
  "name": "Recipe name",
  "description": "One short sentence describing the dish.",
  "cookTime": "e.g. 10 min or 25 min",
  "difficulty": "Easy or Medium or Hard",
  "servings": ${Number(servings) || 4},
  "calories": approximate calories per serving (number),
  "ingredients": [{"name": "ingredient name", "amount": "e.g. 2 cups or 200g"}],
  "instructions": ["Step 1...", "Step 2..."]
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('OpenAI error:', response.status, err);
      return res.status(response.status).json({ error: 'Recipe generation failed' });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      return res.status(500).json({ error: 'No recipe in response' });
    }

    const jsonStr = content.replace(/^```(?:json)?\s*|\s*```$/g, '').trim();
    const recipe = JSON.parse(jsonStr);
    return res.status(200).json(recipe);
  } catch (e) {
    console.error('generate-recipe error:', e);
    return res.status(500).json({ error: e.message || 'Failed to generate recipe' });
  }
}
