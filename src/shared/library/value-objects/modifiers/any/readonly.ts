import { ReadonlyValueObjectException, Result } from 'shared';
import type { TVoidResult } from 'shared';

export function anyReadonly(): TVoidResult {
  return Result.fail(new ReadonlyValueObjectException());
}
