type Entry<T> = { at: number; value: T };

const g = globalThis as unknown as {
  __stockifyMemo?: Map<string, Entry<unknown>>;
  __stockifyInflight?: Map<string, Promise<unknown>>;
};

function store() {
  return (g.__stockifyMemo ??= new Map());
}

function inflight() {
  return (g.__stockifyInflight ??= new Map());
}

/** In-process memo. Used so Robinhood REST and RPC reads are not spammed. */
export async function memoize<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
  const hit = store().get(key) as Entry<T> | undefined;
  if (hit && Date.now() - hit.at < ttlMs) return hit.value;
  const pending = inflight().get(key) as Promise<T> | undefined;
  if (pending) return pending;
  const run = fn()
    .then((value) => {
      store().set(key, { at: Date.now(), value });
      inflight().delete(key);
      return value;
    })
    .catch((error) => {
      inflight().delete(key);
      throw error;
    });
  inflight().set(key, run);
  return run;
}

export function peekMemo<T>(key: string, maxAgeMs?: number): { value: T; ageMs: number } | null {
  const hit = store().get(key) as Entry<T> | undefined;
  if (!hit) return null;
  const ageMs = Date.now() - hit.at;
  if (maxAgeMs != null && ageMs > maxAgeMs) return null;
  return { value: hit.value, ageMs };
}

export function writeMemo<T>(key: string, value: T) {
  store().set(key, { at: Date.now(), value });
}
