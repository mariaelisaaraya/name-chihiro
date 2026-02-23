/**
 * Minimal pino shim for browser use.
 * @aztec/bb.js imports { pino } from 'pino' but pino's browser.js
 * is CJS and doesn't provide a named ESM export. This shim satisfies the import.
 */
function createLogger() {
  const noop = () => {};
  const logger = {
    level: "silent",
    trace: noop, debug: noop, info: noop,
    warn: noop, error: noop, fatal: noop, silent: noop,
    child: () => createLogger(),
    isLevelEnabled: () => false,
  };
  return logger;
}

export function pino() { return createLogger(); }
export default pino;
