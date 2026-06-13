import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Server-Side Google GenAI SDK if the API key is present
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("[SERVER] GoogleGenAI client successfully initialized");
  } catch (error) {
    console.error("[SERVER] Failed to initialize GoogleGenAI:", error);
  }
} else {
  console.warn("[SERVER] Warning: GEMINI_API_KEY is not configured in environment. AI features will run in simulator guest mode.");
}

// 1. API: Agricultural Chatbot Advisor
app.post("/api/chat-advisor", async (req, res) => {
  const { messages, regionName, activeCropName, sensorStats } = req.body;

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Invalid dynamic message prompt array provided." });
  }

  // Format contextual history
  const systemInstruction = 
    "You are a professional, highly trained, and friendly Indian Agricultural Co-operative Agronomist and Advisor. " +
    "You specialize in Indian farming calendars (Kharif, Rabi, Zaid), organic/inorganic fertilizer scheduling based on NPK cards, " +
    "pesticide schedules (e.g., managing cotton bollworm, aphids, or leaf curl virus), water conservation methods, and FPO aggregation " +
    "wholesale logistics. Guide farmers and FPO managers with actual, actionable scientific knowledge. Keep it grounded, clear, " +
    "and highly focused on simple, high-impact regional advice. Use humble, supportive language. Return all advice in elegant Markdown structure.";

  // Context injection
  let contextPrompt = "";
  if (regionName || activeCropName) {
    contextPrompt = `[Context Injection]
Current active region: ${regionName || "Indian soil profile"}.
Active Crop: ${activeCropName || "Diversified crop planning"}.
Soil Moisture & Sensor Stats: ${JSON.stringify(sensorStats || "N/A")}
Provide agronomy counseling referencing these parameters.\n\n`;
  }

  // Fallback if apiKey is not configured
  if (!ai) {
    // Generate a beautiful, structured mock agronomist answer if API key is not yet set
    return res.json({
      text: `### 🌾 [Expert Agronomist Advisor (Offline Demo Mode)]\n\n` +
            `*Great to connect! Here is a localized consultation for your query to optimize crop planning on **${regionName || "your farm"}** cultivating **${activeCropName || "crops"}**:*\n\n` +
            `1. **Soil & Nutrient Plan (NPK)**:\n` +
            `   - Since your soil nitrogen requirement matches your crop specifications, we recommend applying a neem-coated urea top-dressing 21 days post-sowing.\n` +
            `   - Supplement with secondary bio-fertilizer cultures (*Azotobacter* or *Rhizobium*) to naturally boost organic carbon and plant resistance with minimal price overhead.\n\n` +
            `2. **Pest & Crop Safety Alerts**:\n` +
            `   - Keep an eye on bollworm index if growing Bt Cotton during high humidity levels, or leaf rust if growing Wheat. Use neem oil sprays (1500 ppm) as a preventative barrier.\n\n` +
            `3. **Water Management Guidance**:\n` +
            `   - Ensure your drip irrigation intervals are calibrated to critical physiological cycles (e.g., tillering/tasseling phases). Avoid waterlogging drainage blockages!\n\n` +
            `*(Connect actual GEMINI_API_KEY in the Secrets panel to activate direct smart LLM reasoning!)*`
    });
  }

  try {
    // Format conversation history for stateless Gemini generateContent
    const userQuery = messages[messages.length - 1].text;
    const contents = [
      ...messages.slice(0, -1).map((msg: any) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }]
      })),
      {
        role: "user",
        parts: [{ text: contextPrompt + userQuery }]
      }
    ];

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.75,
      }
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error("[SERVER] Gemini Chat Error:", error);
    return res.status(500).json({
      error: "Gemini server request failed.",
      details: error.message || String(error)
    });
  }
});

// Serve Vite Frontend assets
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("[SERVER] Registering Vite development server middleware mode");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[SERVER] Registering high-performance static folder routing");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] End-to-end fullstack server successfully listening on port ${PORT}`);
  });
}

startServer();
