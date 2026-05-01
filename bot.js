/**
 * MAIN ENTRY POINT
 * Trading Signal Bot v3.9 (The AI Sentiment Edition)
 */
import telegramService from './src/services/telegram.js';
import screenerService from './src/services/screener.js';
import dbService from './src/services/database.js';
import logger from './src/utils/logger.js';

function bootstrap() {
  logger.info('Starting Zenith AI Trading Engine v4.5 (Integrity & Trust Edition)...');
  
  try {
    // 1. Inisialisasi Database
    dbService.init();

    // 2. Inisialisasi Bot Telegram
    telegramService.init();
    
    // 3. Inisialisasi Auto-Screener
    screenerService.init(telegramService.bot);

    logger.success('Bot is live with Dynamic Watchlist support!');
  } catch (err) {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));

bootstrap();
