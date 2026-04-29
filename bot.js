/**
 * MAIN ENTRY POINT
 * Trading Signal Bot v3.5 (The Pro Trader Edition)
 */
const telegramService = require('./src/services/telegram');
const screenerService = require('./src/services/screener');
const dbService = require('./src/services/database');
const logger = require('./src/utils/logger');

function bootstrap() {
  logger.info('Starting IDX Signal Bot v3.5 (Database Mode)...');
  
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
