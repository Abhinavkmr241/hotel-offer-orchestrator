import { app } from './app';
import { config } from './config/env';

const server = app.listen(config.port, () => console.log(`Hotel offer API listening on port ${config.port}`));

async function shutdown(signal: string) {
  console.log(`${signal} received; shutting down API`);
  server.close(() => process.exit(0));
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
