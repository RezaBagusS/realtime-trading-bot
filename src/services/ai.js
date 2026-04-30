const { GoogleGenerativeAI } = require("@google/generative-ai");
const config = require("../config");
const logger = require("../utils/logger");

let genAI = null;
let model = null;

if (config.gemini.apiKey) {
  genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
}

/**
 * Menganalisis sentimen dari kumpulan berita saham
 * Returns score (-1 to 1) and a short summary
 */
async function analyzeSentiment(ticker, newsItems) {
  if (!genAI || !model) {
    logger.warn("Gemini API Key tidak tersedia. Melewati analisa sentimen.");
    return { score: 0, summary: "Analisa sentimen dilewati (API Key kosong)." };
  }

  if (newsItems.length === 0) {
    return { score: 0, summary: "Tidak ada berita terbaru untuk dianalisis." };
  }

  try {
    const newsContent = newsItems.map(n => `- [${n.source}] ${n.title}`).join('\n');
    
    const prompt = `
      Anda adalah pakar analis pasar saham Indonesia (IDX).
      Analisis sentimen pasar untuk saham $${ticker.toUpperCase()} berdasarkan berita-berita berikut:
      
      ${newsContent}
      
      Berikan respon dalam format JSON:
      {
        "score": (angka antara -1.0 sampai 1.0, dimana 1.0 sangat bullish, -1.0 sangat bearish, 0 neutral),
        "summary": "Ringkasan 1 kalimat tentang sentimen utama",
        "key_points": ["point 1", "point 2"]
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
      }
    });

    const response = await result.response;
    let text = response.text().trim();
    
    // Pembersihan tambahan jika masih ada markdown block
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    try {
      return JSON.parse(text);
    } catch (parseErr) {
      logger.error(`Gagal parse JSON dari Gemini untuk ${ticker}. Raw text: ${text}`);
      return { score: 0, summary: "Gagal memproses format data AI." };
    }
  } catch (err) {
    logger.error(`Gagal menganalisis sentimen AI untuk ${ticker}:`, err.message);
    return { score: 0, summary: "Gagal memproses sentimen AI (API Error)." };
  }
}

module.exports = { analyzeSentiment };
