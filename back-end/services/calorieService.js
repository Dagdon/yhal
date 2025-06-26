import dotenv from 'dotenv';

dotenv.config();

/**
 * Calculates nutrition from confirmed ingredients
 * @param {string[]} ingredients - Modified ingredient list from controller
 * @param {string} region - African region
 * @returns {Promise<{
 *   calories: number,
 *   nutrients: {protein: number, carbs: number, fat: number}
 * }>}
 */
const calculateNutrition = async (ingredients, region) => {
  if (!process.env.GEMINI_1_5_FLASH) {
    throw new Error('AI_API_KEY_NOT_CONFIGURED');
  }

  const prompt = `Calculate nutrition for ${region} African dish with these ingredients:
    ${ingredients.join(', ')}.
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
