/**
 * MAIN ENTRY POINT
 * Trading Signal Bot v2.5
 */
const telegramService = require('./src/services/telegram');
const screenerService = require('./src/services/screener');
const logger = require('./src/utils/logger');

function bootstrap() {
  logger.info('Starting IDX Signal Bot v2.5...');
  
  try {
    // 1. Inisialisasi Bot Telegram (Command Handlers)
    telegramService.init();
    
    // 2. Inisialisasi Auto-Screener LQ45 (Background Task)
    screenerService.init(telegramService.bot);

    logger.success('Bot is live and waiting for commands!');
  } catch (err) {
    logger.error('Failed to start bot:', err);
    process.exit(1);
  }
}

// Handle unexpected errors
process.on('uncaughtException', (err) => logger.error('Uncaught Exception:', err));
process.on('unhandledRejection', (reason) => logger.error('Unhandled Rejection:', reason));

bootstrap();
