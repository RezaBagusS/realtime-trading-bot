/**
 * MAIN ENTRY POINT
 * Trading Signal Bot v3.9 (The AI Sentiment Edition)
 */
import telegramService from './src/services/telegram.js';
import screenerService from './src/services/screener.js';
import hunterService from './src/services/hunter.js';
import dbService from './src/services/database.js';
import logger from './src/utils/logger.js';
import config from './src/config/index.js';
import { validateConfig } from './src/config/validator.js';

function bootstrap() {
  logger.info('🚀 Zenith AI v4.5: Powering up...');
  
  // 0. Validate Environment (Fail Fast)
  validateConfig(config);
  
  try {
    // 1. Inisialisasi Database
    dbService.init();

    // 2. Inisialisasi Bot Telegram
    telegramService.init();
    
    // 3. Inisialisasi Auto-Screener (Radar Pribadi)
    screenerService.init(telegramService.bot);

    // 4. Inisialisasi Market Hunter (Pencarian Global 15:30 WIB)
    hunterService.init(telegramService.bot);

    logger.success('Bot is live with Dynamic Watchlist support!');
  } catch (err) {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', (err) => logger.error('Unhandled Rejection:', err));

// Graceful Shutdown (Go-style)
const shutdown = () => {
  logger.warn('Shutting down gracefully...');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));

bootstrap();
