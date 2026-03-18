import { mkdir } from 'node:fs/promises';
import path from 'node:path';

export const RUNTIME_CACHE_DIR = path.resolve(process.cwd(), 'server', '.runtime-cache');

export function resolveRuntimeCacheFile(fileName) {
  return path.join(RUNTIME_CACHE_DIR, fileName);
}

export async function ensureRuntimeCacheDir() {
  await mkdir(RUNTIME_CACHE_DIR, { recursive: true });
}
