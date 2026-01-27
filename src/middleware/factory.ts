import { Router, json, static as expressStatic } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from '../db/index.js';
import { createApiRouter } from '../api/router.js';
import { createInjector } from './injector.js';
import { errorHandler, notFoundHandler } from './error-handler.js';
import { resolveConfig, getClientConfig } from '../config/index.js';
import type { PrototypeAnnotatorConfig, PrototypeAnnotatorMiddleware } from '../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createPrototypeAnnotator(
  userConfig?: PrototypeAnnotatorConfig
): PrototypeAnnotatorMiddleware {
  // Resolve configuration
  const config = resolveConfig(userConfig);

  // Initialize database
  initDatabase(config.dbPath);

  // Create main router
  const router = Router();

  // JSON body parser for API routes
  router.use(json());

  // Client config for injection
  const clientConfig = getClientConfig(config);

  // Mount API router
  router.use(`${config.basePath}/api`, createApiRouter(config));

  // Serve static files for overlay and dashboard
  const clientDistPath = path.resolve(__dirname, '../../client/dist');

  // Serve overlay.js
  router.use(`${config.basePath}/overlay.js`, expressStatic(path.join(clientDistPath, 'overlay.js')));

  // Serve dashboard if enabled
  if (config.enableDashboard) {
    router.use(
      `${config.basePath}/dashboard`,
      expressStatic(path.join(clientDistPath, 'dashboard'))
    );

    // SPA fallback for dashboard routes
    router.get(`${config.basePath}/dashboard/*`, (_req, res) => {
      res.sendFile(path.join(clientDistPath, 'dashboard', 'index.html'));
    });
  }

  // Error handlers for API routes
  router.use(`${config.basePath}/api`, notFoundHandler);
  router.use(`${config.basePath}/api`, errorHandler);

  // Create injector middleware for HTML responses (if overlay enabled)
  let injector: ReturnType<typeof createInjector> | null = null;
  if (config.enableOverlay) {
    injector = createInjector(config.basePath, clientConfig);
  }

  // Create combined middleware
  const combinedMiddleware = Router();

  // HTML injection needs to run before other middleware
  if (injector) {
    combinedMiddleware.use(injector);
  }

  // Mount the main router
  combinedMiddleware.use(router);

  // Return middleware object with both .middleware() method and .router property
  return {
    middleware: () => combinedMiddleware,
    router: combinedMiddleware,
    config,
  };
}
