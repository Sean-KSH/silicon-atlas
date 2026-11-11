/**
 * Shareable setups: module settings mirrored into the URL after the module hash, for example
 * `#junction?na=1e23&nd=1e21&voltage=-3`. Values are the module's own internal values (SI units),
 * exactly as its physics kernel receives them, so a link reproduces a setup precisely.
 *
 * `useLinkedState` behaves like React's useState. On first render it starts from the value in
 * the link when one is present and of the right type; afterwards it writes changes back with
 * history.replaceState (no new history entries, no hashchange event). Settings equal to their
 * default are left out, so a fresh module has a clean URL and "Reset module" clears the link.
 */
import { useEffect, useRef, useState } from 'react';

type Primitive = string | number | boolean;

function readParams(): URLSearchParams {
  const hash = location.hash;
  const q = hash.indexOf('?');
  return new URLSearchParams(q >= 0 ? hash.slice(q + 1) : '');
}

function writeParams(update: (p: URLSearchParams) => void) {
  const hash = location.hash || '#';
  const q = hash.indexOf('?');
  const base = q >= 0 ? hash.slice(0, q) : hash;
  const params = readParams();
  update(params);
  const query = params.toString();
  const next = base + (query ? `?${query}` : '');
  if (next !== hash) history.replaceState(history.state, '', next);
}

function parse(raw: string | null, like: Primitive): Primitive | undefined {
  if (raw === null) return undefined;
  if (typeof like === 'number') {
    const v = Number(raw);
    return raw.trim() !== '' && Number.isFinite(v) ? v : undefined;
  }
  if (typeof like === 'boolean') return raw === 'true' ? true : raw === 'false' ? false : undefined;
  return raw;
}

/** Short, readable form: 1e+23 -> 1e23 (Number() reads both). */
const encode = (v: Primitive) => String(v).replace('e+', 'e');

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/** Read an initial value from the link. Objects map each primitive field to its own parameter. */
export function initialFromLink<T>(name: string, fallback: T): T {
  const params = readParams();
  if (isPlainObject(fallback)) {
    const out: Record<string, unknown> = { ...fallback };
    for (const [k, v] of Object.entries(fallback)) {
      if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
      const parsed = parse(params.get(name + k), v);
      if (parsed !== undefined) out[k] = parsed;
    }
    return out as T;
  }
  if (
    typeof fallback === 'string' ||
    typeof fallback === 'number' ||
    typeof fallback === 'boolean'
  ) {
    const parsed = parse(params.get(name), fallback);
    return (parsed ?? fallback) as T;
  }
  return fallback;
}

/**
 * useState whose value is mirrored in the link.
 * @param name  parameter name; for an object state, a prefix for its fields ('' for none)
 * @param initial  default value (also what counts as "unchanged")
 */
export function useLinkedState<T>(name: string, initial: T | (() => T)) {
  const defaults = useRef<T>(
    typeof initial === 'function' ? (initial as () => T)() : initial,
  ).current;
  const [value, setValue] = useState<T>(() => initialFromLink(name, defaults));
  useEffect(() => {
    writeParams((p) => {
      if (isPlainObject(value) && isPlainObject(defaults)) {
        for (const [k, d] of Object.entries(defaults)) {
          const v = (value as Record<string, unknown>)[k];
          if (typeof v !== 'string' && typeof v !== 'number' && typeof v !== 'boolean') continue;
          if (v === d) p.delete(name + k);
          else p.set(name + k, encode(v));
        }
      } else if (value === defaults) p.delete(name);
      else p.set(name, encode(value as Primitive));
    });
  }, [value, name, defaults]);
  return [value, setValue] as const;
}
