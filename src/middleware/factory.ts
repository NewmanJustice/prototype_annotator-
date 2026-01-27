import { Router, json, static as expressStatic, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabaseAsync } from '../db/index.js';
import { createApiRouter } from '../api/router.js';
import { createInjector } from './injector.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import { resolveConfig, getClientConfig } from '../config/index.js';
import type { PrototypeAnnotatorConfig, PrototypeAnnotatorMiddleware } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Resolve client dist path - works both in development and when installed as dependency
function getClientDistPath(): string {
  // In the built package, __dirname is dist/, so client/dist is at ../client/dist
  // But we need to handle both:
  // 1. Development: src/middleware/factory.ts -> ../../client/dist
  // 2. Installed: node_modules/prototype-annotator/dist/index.js -> ../client/dist

  // Try the installed package path first (dist/ -> client/dist)
  const installedPath = path.resolve(__dirname, '../client/dist');
  const devPath = path.resolve(__dirname, '../../client/dist');

  // Check if we're in a bundled dist folder
  if (__dirname.endsWith('dist') || __dirname.includes('dist/')) {
    return installedPath;
  }

  return devPath;
}

export async function createPrototypeAnnotator(
  userConfig?: PrototypeAnnotatorConfig
): Promise<PrototypeAnnotatorMiddleware> {
  // Resolve configuration
  const config = resolveConfig(userConfig);

  // Initialize database (async for sql.js)
  await initDatabaseAsync(config.dbPath);

  // Create main router for API and static files
  const router = Router();

  // JSON body parser for API routes
  router.use(json());

  // Client config for injection
  const clientConfig = getClientConfig(config);

  // Mount API router
  router.use(`${config.basePath}/api`, createApiRouter(config));

  // Serve static files for overlay and dashboard
  const clientDistPath = getClientDistPath();

  // Serve overlay.js using sendFile (not express.static which expects a directory)
  router.get(`${config.basePath}/overlay.js`, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'overlay.js'));
  });

  // Serve overlay.js.map for debugging
  router.get(`${config.basePath}/overlay.js.map`, (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDistPath, 'overlay.js.map'));
  });

  // Serve dashboard if enabled
  if (config.enableDashboard) {
    // Serve dashboard static assets
    router.use(
      `${config.basePath}/dashboard`,
      expressStatic(path.join(clientDistPath, 'dashboard'))
    );

    // SPA fallback for dashboard routes
    router.get(`${config.basePath}/dashboard/*`, (_req: Request, res: Response) => {
      res.sendFile(path.join(clientDistPath, 'dashboard', 'index.html'));
    });
  }

  // Error handlers for API routes
  router.use(`${config.basePath}/api`, notFoundHandler);
  router.use(`${config.basePath}/api`, errorHandler);

  // Create injector middleware for HTML responses (if overlay enabled)
  const injector = config.enableOverlay
    ? createInjector(config.basePath, clientConfig)
    : null;

  // Create combined middleware (for backwards compatibility)
  const combinedMiddleware = Router();

  // HTML injection needs to run before other middleware
  if (injector) {
    combinedMiddleware.use(injector);
  }

  // Mount the main router
  combinedMiddleware.use(router);

  // Create a passthrough middleware if no injector
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const injectorMiddleware = injector || ((_req: any, _res: any, next: () => void) => next());

  // Return middleware object with separate router and injector
  return {
    middleware: () => combinedMiddleware,
    router,  // Just API routes and static files (no injection)
    injector: injectorMiddleware,
    config,
  };
}
