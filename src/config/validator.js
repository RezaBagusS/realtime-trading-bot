import logger from '../utils/logger.js';

/**
 * Validates essential environment variables at startup.
 * Prevents the bot from running in an unstable state.
 */
export function validateConfig(config) {
  const errors = [];

  // Telegram
  if (!config.telegram.token) errors.push('TELEGRAM_BOT_TOKEN is missing');
  
  // Gemini AI
  if (config.gemini.apiKeys.length === 0) {
    errors.push('GEMINI_API_KEY is missing or invalid');
  }

  // TradingView
  if (!config.tradingview.session || !config.tradingview.signature) {
    logger.warn('TradingView session/signature is missing. Bot might fail to fetch private/pro data.');
  }

  if (errors.length > 0) {
    logger.error('❌ CONFIGURATION ERROR:');
    errors.forEach(err => console.log(`   - ${err}`));
    process.exit(1);
  }

  logger.success('✅ Configuration Validated.');
}
