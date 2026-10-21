import type { Document } from 'mongoose';

/**
 * Runs `await doc.validate()` (NOT the deprecated `validateSync`, which skips
 * sub-document pre('validate') hooks) and returns the failing path keys from
 * the rejected ValidationError. An empty array means the document validated.
 */
export async function validatedErrorPaths(doc: Document): Promise<string[]> {
  const rejection = await doc.validate().then(
    () => undefined,
    (rejected: { errors?: Record<string, unknown> }) => rejected,
  );
  return Object.keys(rejection?.errors ?? {});
}
