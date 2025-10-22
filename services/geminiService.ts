
import { GoogleGenAI } from "@google/genai";

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

export const generateJobDescription = async (
  title: string,
  keywords: string
): Promise<string> => {
  if (!process.env.API_KEY) {
    return Promise.resolve("API Key not configured. Please set the API_KEY environment variable. This is a placeholder description based on your input. It should be detailed and engaging to attract top talent.");
  }

  const prompt = `
    You are an expert HR copywriter for a university job board. Your audience is talented students and recent graduates.
    Generate a compelling, professional, and engaging job description for the following role.

    Job Title: "${title}"
    Key Responsibilities/Keywords: "${keywords}"

    Structure the output in Markdown format with the following sections:
    - **About the Role:** A brief, exciting overview of the position.
    - **What You'll Do:** A bulleted list of key responsibilities.
    - **What You'll Bring:** A bulleted list of required skills and qualifications (mentioning things like "a degree in a related field" is good).
    - **Why You'll Love Working With Us:** A few bullet points highlighting company culture, benefits, or growth opportunities.

    The tone should be professional yet approachable. Avoid corporate jargon. Focus on making the role sound like an amazing opportunity for a bright, ambitious individual.
    `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error generating job description:", error);
    return "There was an error generating the description. Please try again. As a fallback, here is a basic template: Describe the role, responsibilities, and qualifications required.";
  }
};
