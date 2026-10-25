import { startServer } from './app';

// One room's bug must not take every room down.
process.on('uncaughtException', (e) => console.error('uncaught', e));

startServer(Number(process.env.PORT ?? 3001));
