import dotenv from 'dotenv';

dotenv.config();

/**
 * Predicts food details from image (NO nutrition data)
 * @param {Buffer} imageBuffer - Food image buffer
 * @returns {Promise<{
 *   predictedName: string,
 *   predictedOrigin: string,
 *   predictedIngredients: string[]
 * }>}
 */
const predictIngredients = async (imageBuffer) => {
  if (!process.env.GEMINI_1_5_FLASH) {
    throw new Error('AI_API_KEY_NOT_CONFIGURED');
  }

  const prompt = `Analyze this African food image and return ONLY:
    1. Common local name
    2. Regional origin (West/East/North/South/Central Africa)
    3. List of ingredients
    Return JSON format: {name:string, origin:string, ingredients:string[]}`;

  try {
    const base64Image = imageBuffer.toString('base64');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_1_5_FLASH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } },
            ],
          }],
        }),
      },
    );

    if (!response.ok) throw new Error('AI_REQUEST_FAILED');

    const { candidates } = await response.json();
    const { name, origin, ingredients } = JSON.parse(candidates[0].content.parts[0].text);

    return {
      predictedName: name,
      predictedOrigin: origin,
      predictedIngredients: ingredients,
    };
  } catch (error) {
    console.error('AI Prediction Failed:', error);
    throw new Error('INGREDIENT_PREDICTION_FAILED');
  }
};

export default predictIngredients;
