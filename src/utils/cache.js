import logger from './logger.js';

const cache = new Map();

/**
 * Simpan data ke cache dengan TTL (Time To Live)
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlMinutes (Default 120 menit)
 */
function set(key, value, ttlMinutes = 120) {
  const expiry = Date.now() + (ttlMinutes * 60 * 1000);
  cache.set(key, { value, expiry });
  logger.info(`Cache SET: ${key} (Expires in ${ttlMinutes}m)`);
}

/**
 * Ambil data dari cache
 * @param {string} key 
 */
function get(key) {
  const data = cache.get(key);
  
  if (!data) return null;

  if (Date.now() > data.expiry) {
    cache.delete(key);
    logger.info(`Cache EXPIRED/DELETE: ${key}`);
    return null;
  }

  logger.info(`Cache HIT: ${key}`);
  return data.value;
}

/**
 * Hapus key spesifik
 */
function del(key) {
  cache.delete(key);
}

export default { set, get, del };
export { set, get, del };
