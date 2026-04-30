module.exports = {
  info: (msg, ...args) => console.log(`[INFO] ${msg}`, ...args),
  error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  debug: (msg, ...args) => console.log(`[DEBUG] ${msg}`, ...args),
  warn: (msg, ...args) => console.warn(`[WARN] ⚠️ ${msg}`, ...args),
  success: (msg, ...args) => console.log(`[SUCCESS] ✅ ${msg}`, ...args)
};
