import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import notifier from 'node-notifier';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, 'state.json');
const LOG_PATH = path.join(__dirname, 'monitor.log');

const INTERVAL_MS = 15 * 60 * 1000;
const KNOTS_STALE_MS = 3 * 60 * 1000;

const UMBREL_URL = 'http://umbrel.local/';
const KNOTS_API_URL = 'https://www.satoshidashboard.com/api/public/mempool/node';
const KNOTS_PAGE_URL = 'https://www.satoshidashboard.com/module/s04-bitcoin-mempool-fees';

const ONCE = process.argv.includes('--once');
const SIMULATE_DEAD = process.argv.find((arg) => arg.startsWith('--simulate-dead='))?.split('=')[1] || '';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso() {
  return new Date().toISOString();
}

function log(message) {
  const line = `[${nowIso()}] ${message}`;
  console.log(line);
  try {
    fs.appendFileSync(LOG_PATH, `${line}\n`, 'utf8');
  } catch {
    // ignore log write failures
  }
}

function writeAtomic(filePath, content) {
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

function loadState() {
  try {
    if (!fs.existsSync(STATE_PATH)) throw new Error('no state file yet');
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
  } catch {
    return {
      umbrel: { status: 'unknown', lastChangeAt: null, lastCheckedAt: null },
      knots: { status: 'unknown', lastChangeAt: null, lastCheckedAt: null },
    };
  }
}

function writeState(state) {
  writeAtomic(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

async function fetchWithRetry(url, { timeoutMs = 8000, retries = 2, retryDelayMs = 3000, headers = {} } = {}) {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
    try {
      const response = await fetch(url, { signal: controller.signal, headers });
      clearTimeout(timer);
      return response;
    } catch (error) {
      clearTimeout(timer);
      lastError = error;
      if (attempt < retries) await sleep(retryDelayMs);
    }
  }
  throw lastError;
}

async function checkUmbrel() {
  if (SIMULATE_DEAD === 'umbrel') {
    return { alive: false, detail: 'simulated dead' };
  }
  try {
    const response = await fetchWithRetry(UMBREL_URL, { timeoutMs: 8000, retries: 2, retryDelayMs: 3000 });
    if (response.status >= 500) {
      return { alive: false, detail: `HTTP ${response.status}` };
    }
    return { alive: true, detail: `HTTP ${response.status}` };
  } catch (error) {
    return { alive: false, detail: error.message };
  }
}

async function checkKnots() {
  if (SIMULATE_DEAD === 'knots') {
    return { alive: false, detail: 'simulated dead' };
  }
  try {
    const response = await fetchWithRetry(KNOTS_API_URL, {
      timeoutMs: 10000,
      retries: 2,
      retryDelayMs: 3000,
      headers: { accept: 'application/json' },
    });
    if (!response.ok) {
      return { alive: false, detail: `HTTP ${response.status}` };
    }
    const payload = await response.json();
    if (payload?.is_fallback) {
      return { alive: false, detail: `is_fallback=true (${payload.fallback_note || 'sin detalle'})` };
    }
    const updatedAt = Date.parse(payload?.updated_at || '');
    if (Number.isNaN(updatedAt)) {
      return { alive: false, detail: 'updated_at ausente o inválido' };
    }
    const ageMs = Date.now() - updatedAt;
    if (ageMs > KNOTS_STALE_MS) {
      return { alive: false, detail: `datos con ${Math.round(ageMs / 1000)}s de antigüedad` };
    }
    return { alive: true, detail: `updated_at=${payload.updated_at}` };
  } catch (error) {
    return { alive: false, detail: error.message };
  }
}

function notifyDead(title, message) {
  notifier.notify({
    title,
    message,
    sound: true,
    wait: false,
  });
}

async function runCheck(key, label, checkFn, state, deadTitle, aliveNoun) {
  const result = await checkFn();
  const newStatus = result.alive ? 'alive' : 'dead';
  const prev = state[key];
  const changed = prev.status !== newStatus;

  state[key] = {
    status: newStatus,
    lastChangeAt: changed ? nowIso() : prev.lastChangeAt,
    lastCheckedAt: nowIso(),
  };

  log(`${label}: ${newStatus} (${result.detail})`);

  if (changed && newStatus === 'dead') {
    const message = `${aliveNoun} dejó de responder a las ${new Date().toLocaleTimeString('es-AR')}. Detalle: ${result.detail}`;
    notifyDead(deadTitle, message);
    log(`ALERTA disparada: ${deadTitle} - ${message}`);
  } else if (changed && newStatus === 'alive' && prev.status === 'dead') {
    log(`${label} se recuperó (sin aviso, según config).`);
  }
}

async function checkOnce() {
  const state = loadState();
  await runCheck('umbrel', 'Umbrel', checkUmbrel, state, 'Umbrel caído', 'umbrel.local');
  await runCheck('knots', 'Knots node data', checkKnots, state, 'Knots node sin datos', `Knots node data (${KNOTS_PAGE_URL})`);
  writeState(state);
}

process.on('uncaughtException', (error) => {
  log(`uncaughtException: ${error?.stack || error}`);
});
process.on('unhandledRejection', (error) => {
  log(`unhandledRejection: ${error?.stack || error}`);
});

async function main() {
  log(`monitor iniciado (once=${ONCE}, simulate=${SIMULATE_DEAD || 'none'})`);
  if (ONCE) {
    await checkOnce();
    return;
  }
  while (true) {
    try {
      await checkOnce();
    } catch (error) {
      log(`checkOnce error: ${error?.stack || error}`);
    }
    await sleep(INTERVAL_MS);
  }
}

await main();
