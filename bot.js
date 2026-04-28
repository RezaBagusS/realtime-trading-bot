/**
 * MAIN ENTRY POINT
 * Trading Signal Bot v2.1
 */
const telegramService = require('./src/services/telegram');
const logger = require('./src/utils/logger');

function bootstrap() {
  logger.info('Starting IDX Signal Bot in Modular Mode...');
  
  try {
    telegramService.init();
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
