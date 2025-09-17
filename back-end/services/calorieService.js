import dotenv from 'dotenv';

dotenv.config();

/**
 * Calculates nutrition from confirmed inputs
 * @param {string} name - Confirmed food name (optional but recommended)
 * @param {string[]} ingredients - Confirmed or modified ingredient list
 * @param {string} region - Regional origin (West/East/North/South/Central)
 * @returns {Promise<{
 *   calories: number,
 *   nutrients: {protein: number, carbs: number, fat: number}
 * }>}
 */
const calculateNutrition = async (name, ingredients, region) => {
  if (!process.env.GEMINI_1_5_FLASH) {
    throw new Error('AI_API_KEY_NOT_CONFIGURED');
  }

  const prompt = `Calculate nutrition for an African dish.
    Name: ${name || 'Unknown'}
    Region: ${region}
    Ingredients: ${ingredients.join(', ')}
    Return ONLY JSON: {
      calories: number,
      nutrients: {protein: number, carbs: number, fat: number}
    }`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_1_5_FLASH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) throw new Error('NUTRITION_REQUEST_FAILED');

    const { candidates } = await response.json();
    return JSON.parse(candidates[0].content.parts[0].text);
  } catch (error) {
    console.error('Nutrition Calculation Failed:', error);
    throw new Error('NUTRITION_CALCULATION_FAILED');
  }
};

export default calculateNutrition;
