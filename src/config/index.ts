import { z } from 'zod';
import path from 'path';
import type { PrototypeAnnotatorConfig, ResolvedConfig, ActorMode } from '../types/index.js';

// Zod schema for configuration validation
export const ConfigSchema = z.object({
  basePath: z.string().default('/__prototype-annotator'),
  dbPath: z.string().default('./prototype-annotator/annotator.sqlite'),
  exportDir: z.string().default('./prototype_annotator_exports'),
  defaultActor: z.string().default('anonymous'),
  enableOverlay: z.boolean().default(true),
  enableDashboard: z.boolean().default(true),
  urlMode: z.enum(['full', 'canonical']).default('full'),
  actorMode: z.enum(['prompt', 'anonymous', 'fixed']).default('prompt'),
});

export function resolveConfig(input?: PrototypeAnnotatorConfig): ResolvedConfig {
  const parsed = ConfigSchema.parse(input ?? {});

  // Ensure basePath starts with / and has no trailing slash
  let basePath = parsed.basePath;
  if (!basePath.startsWith('/')) {
    basePath = '/' + basePath;
  }
  basePath = basePath.replace(/\/+$/, '');

  // Resolve paths relative to cwd
  const dbPath = path.isAbsolute(parsed.dbPath)
    ? parsed.dbPath
    : path.resolve(process.cwd(), parsed.dbPath);

  const exportDir = path.isAbsolute(parsed.exportDir)
    ? parsed.exportDir
    : path.resolve(process.cwd(), parsed.exportDir);

  return {
    basePath,
    dbPath,
    exportDir,
    defaultActor: parsed.defaultActor,
    enableOverlay: parsed.enableOverlay,
    enableDashboard: parsed.enableDashboard,
    urlMode: parsed.urlMode,
    actorMode: parsed.actorMode as ActorMode,
  };
}

export function getClientConfig(config: ResolvedConfig): {
  basePath: string;
  apiUrl: string;
  defaultActor: string;
  actorMode: ActorMode;
} {
  return {
    basePath: config.basePath,
    apiUrl: `${config.basePath}/api`,
    defaultActor: config.defaultActor,
    actorMode: config.actorMode,
  };
}
