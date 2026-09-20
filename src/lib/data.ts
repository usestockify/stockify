/** Shared load states for Robinhood REST, RPC, and PONS reads. Never a demo fallback. */
export type DataStatus = "loading" | "ready" | "error" | "stale" | "unavailable";

export type DataEnvelope<T> = {
  status: DataStatus;
  data: T | null;
  error?: string;
  fetchedAt?: string;
};

export function ready<T>(data: T, fetchedAt = new Date().toISOString()): DataEnvelope<T> {
  return { status: "ready", data, fetchedAt };
}

export function unavailable<T = never>(error: string, fetchedAt?: string): DataEnvelope<T> {
  return { status: "unavailable", data: null, error, fetchedAt };
}

export function failed<T = never>(error: string, fetchedAt?: string): DataEnvelope<T> {
  return { status: "error", data: null, error, fetchedAt };
}

export function stale<T>(data: T, error: string, fetchedAt?: string): DataEnvelope<T> {
  return { status: "stale", data, error, fetchedAt };
}

export function loading<T = never>(): DataEnvelope<T> {
  return { status: "loading", data: null };
}

/** Resolve `promise` or `fallback` after `ms`. Never throws. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      },
    );
  });
}
