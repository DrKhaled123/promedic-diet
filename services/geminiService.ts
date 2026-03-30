import { GoogleGenAI } from "@google/genai";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getHealthTip = async (calories: number, age: number, gender: string): Promise<string> => {
  if (!apiKey) {
    console.warn("API Key is missing for Gemini");
    return "حافظ على شرب الماء بانتظام وتناول الخضروات الورقية.";
  }

  try {
    const genderAr = gender === 'male' ? 'رجل' : 'امرأة';
    const prompt = `
      قدم نصيحة صحية قصيرة ومشجعة جداً (جملتين كحد أقصى) لـ ${genderAr} عمره ${age} سنة، يحتاج إلى تناول حوالي ${calories} سعر حراري يومياً.
      النصيحة يجب أن تكون باللغة العربية وتركز على الالتزام والاستمرارية.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error fetching tip from Gemini:", error);
    return "تذكر أن الاستمرارية هي مفتاح النجاح في أي نظام غذائي. ابدأ يومك بابتسامة وهدف واضح!";
  }
};