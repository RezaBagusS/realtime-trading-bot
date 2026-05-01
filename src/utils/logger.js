export const info = (msg, ...args) => console.log(`[INFO] ${msg}`, ...args);
export const error = (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args);
export const debug = (msg, ...args) => console.log(`[DEBUG] ${msg}`, ...args);
export const warn = (msg, ...args) => console.warn(`[WARN] ⚠️ ${msg}`, ...args);
export const success = (msg, ...args) => console.log(`[SUCCESS] ✅ ${msg}`, ...args);

export default { info, error, debug, warn, success };
