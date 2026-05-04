import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import config from "../config/index.js";
import logger from "../utils/logger.js";
import cache from "../utils/cache.js";
import dbService from "./database.js";

let models = [];
let currentKeyIndex = 0;
let depletedKeys = new Set();

function initModels() {
  models = config.gemini.apiKeys.map(key => {
    const genAI = new GoogleGenerativeAI(key);
    return genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash", // Use 2.5 Flash as per original system config
      systemInstruction: {
        role: "system",
        parts: [{ text: `Anda adalah Zenith AI Engine, analis kuantitatif senior di bursa saham Indonesia (IDX).
Tugas Anda adalah melakukan ekstraksi data material dari berita bursa dan memberikan skor sentimen yang objektif.
Anda harus memfilter clickbait, berita 'pom-pom' tanpa data, dan informasi yang tidak relevan dengan fundamental emiten.
Gunakan data historis dan logika ekonomi untuk menilai dampak berita terhadap harga saham dalam jangka pendek-menengah.` }]
      }
    });
  });
}

initModels();

/**
 * Mendapatkan model Gemini yang masih memiliki kuota
 */
function getActiveGeminiModel() {
  if (models.length === 0) return null;
  for (let i = 0; i < models.length; i++) {
    const idx = (currentKeyIndex + i) % models.length;
    if (!depletedKeys.has(idx)) {
      currentKeyIndex = idx;
      return models[idx];
    }
  }
  return null;
}

/**
 * Analisa menggunakan Gemini Cloud
 */
async function callGemini(ticker, prompt) {
  const model = getActiveGeminiModel();
  if (!model) throw new Error("429 All Gemini Keys Depleted");

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.1, // Low temperature for consistent financial analysis
      topP: 0.8,
      topK: 40
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" }
    ]
  });

  const response = await result.response;
  return response.text().trim();
}

/**
 * Analisa menggunakan Local LLM (Ollama/LocalAI)
 */
async function callLocal(ticker, prompt) {
  logger.info(`Memanggil Local AI ($${ticker}) via ${config.gemini.localUrl}...`);
  
  const res = await axios.post(config.gemini.localUrl, {
    model: config.gemini.localModel,
    messages: [{ role: "user", content: prompt }],
    stream: false,
    format: "json"
  }, { timeout: 60000 }); // Local LLM might be slow

  return typeof res.data.choices[0].message.content === 'string' 
    ? res.data.choices[0].message.content 
    : JSON.stringify(res.data.choices[0].message.content);
}

/**
 * Menganalisis sentimen dari kumpulan berita saham
 * Returns score (-1 to 1) and a short summary
 */
async function analyzeSentiment(ticker, newsItems) {
  if (newsItems.length === 0) {
    return { score: 0, summary: "Tidak ada berita terbaru untuk dianalisis." };
  }

  // 1. Cek Cache Database (Persistent)
  let cachedData = await dbService.getAiCache(ticker);
  if (cachedData) {
    logger.info(`[CACHE] Hit DB untuk $${ticker.toUpperCase()}`);
    return cachedData;
  }

  // 2. Cek Cache Memory (Fallback)
  const cacheKey = `sentiment_${ticker.toUpperCase()}`;
  cachedData = cache.get(cacheKey);
  if (cachedData) {
    logger.info(`[CACHE] Hit Memory untuk $${ticker.toUpperCase()}`);
    return cachedData;
  }

  try {
    const newsContent = newsItems.map(n => `- [${n.source}] ${n.title}`).join('\n');
    const prompt = `
      Anda adalah Senior Quant & Sentiment Analyst di bursa saham Indonesia (IDX).
      Tugas Anda adalah menganalisis sentimen pasar untuk saham $${ticker.toUpperCase()} berdasarkan data berita berikut:
      
      ${newsContent}
      
      ### INSTRUKSI KRITIS:
      1. FILTER CLICKBAIT & NOISE: Abaikan berita yang hanya berisi ringkasan harian bursa (IHSG), berita "pom-pom" tanpa data, atau judul yang hanya mengulang harga tanpa ada aksi korporasi/peristiwa baru.
      2. PRIORITAS SUMBER: Berikan bobot lebih tinggi pada berita dari [IDX/PENGUMUMAN], CNBC Indonesia, Kontan, dan Bisnis.com.
      3. ANALISIS MATERIALITAS: Fokus pada peristiwa material:
         - Bullish (+): Laba naik signifikan, kontrak baru, akuisisi, dividen besar, atau aksi korporasi strategis.
         - Bearish (-): Rugi bersih, sengketa hukum, gagal bayar, atau sentimen negatif industri.
      4. SKEPTISISME: Jika berita bersifat spekulatif atau rumor, kurangi bobot skornya mendekati 0 (Netral).
      
      Berikan respon dalam format JSON murni:
      {
        "score": (float antara -1.0 sampai 1.0),
        "summary": "Analisis tajam 1 kalimat (hindari kata-kata basi)",
        "key_points": ["Analisis poin material 1", "Analisis poin material 2"],
        "confidence": (float 0.0 sampai 1.0),
        "sentiment_label": "BULLISH / BEARISH / NEUTRAL / NOISY"
      }
    `;

    let text;
    if (config.gemini.provider === 'local') {
      text = await callLocal(ticker, prompt);
    } else {
      text = await callGemini(ticker, prompt);
    }

    // Pembersihan tambahan jika masih ada markdown block
    text = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(text);
    
    // Simpan ke Cache Database & Memory (TTL 2 Jam)
    await dbService.setAiCache(ticker, parsed, 120);
    cache.set(cacheKey, parsed, 120);
    
    logger.success(`[AI] Berhasil menganalisa $${ticker.toUpperCase()} (Score: ${parsed.score})`);
    return parsed;

  } catch (err) {
    const isQuotaExceeded = err.message.includes('429') || err.message.includes('quota');
    
    if (isQuotaExceeded && config.gemini.provider === 'gemini') {
      logger.warn(`Gemini Key #${currentKeyIndex} mencapai limit. Rotasi...`);
      depletedKeys.add(currentKeyIndex);
      
      // Jika semua key habis, simpan status LIMITED ke cache selama 15 menit
      // agar tidak terus-menerus mencoba memanggil API yang sedang memblokir.
      if (depletedKeys.size >= models.length) {
        const negativeCache = { 
          score: 0, 
          summary: "Kuota AI Habis (Sistem Menunggu 15 Menit)", 
          sentiment_label: "LIMITED",
          confidence: 0
        };
        dbService.setAiCache(ticker, negativeCache, 15);
        cache.set(cacheKey, negativeCache, 15);
        return negativeCache;
      }

      return analyzeSentiment(ticker, newsItems);
    }

    logger.error(`AI Error untuk ${ticker}:`, err.message);
    return { 
      score: 0, 
      summary: "AI Offline/Limit (Gunakan Analisa Teknikal)", 
      sentiment_label: "LIMITED",
      confidence: 0
    };
  }
}

export { analyzeSentiment };
export default { analyzeSentiment };
