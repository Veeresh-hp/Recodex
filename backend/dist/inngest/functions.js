"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateIndustryInsights = void 0;
const client_1 = require("./client");
const generative_ai_1 = require("@google/generative-ai");
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "placeholder_gemini_key";
const genAI = new generative_ai_1.GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
exports.generateIndustryInsights = client_1.inngest.createFunction({
    id: "generate-industry-insights",
    name: "Generate Industry Insights",
    triggers: [{ cron: "0 0 * * 0" }]
}, async ({ step }) => {
    const industries = ["Web Systems", "AI & Intelligence", "Blockchain & Web3", "Low-Level Shells"];
    for (const industry of industries) {
        const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }
          
          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;
        const res = await step.run(`Generate ${industry} insights`, async () => {
            try {
                if (GEMINI_API_KEY === "placeholder_gemini_key") {
                    console.log(`[INNGEST] Using placeholder insights for ${industry} (No Gemini key provided)`);
                    return {
                        salaryRanges: [
                            { role: "Junior Developer", min: 60000, max: 90000, median: 75000, location: "Remote" },
                            { role: "Senior Developer", min: 110000, max: 160000, median: 135000, location: "Remote" }
                        ],
                        growthRate: 15,
                        demandLevel: "High",
                        topSkills: ["TypeScript", "React", "Node.js"],
                        marketOutlook: "Positive",
                        keyTrends: ["Serverless", "Edge Computing"],
                        recommendedSkills: ["TypeScript"]
                    };
                }
                const result = await model.generateContent(prompt);
                const text = result.response.text();
                const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
                return JSON.parse(cleanedText);
            }
            catch (err) {
                console.error(`Failed to generate insights for ${industry}:`, err);
                return { error: err.message };
            }
        });
        await step.run(`Log ${industry} insights`, async () => {
            console.log(`[INNGEST CRON JOB] Sunday Midnight Update for ${industry}:`, JSON.stringify(res, null, 2));
        });
    }
});
