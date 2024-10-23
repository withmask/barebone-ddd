import { Result } from 'shared';
import { Exception } from 'shared';
import type { TVoidResult } from 'shared';

export class ReadonlyValueObjectException extends Exception<'validation'> {
  public constructor() {
    super('validation');
  }
}

export function anyReadonly(): TVoidResult {
  return Result.fail(new ReadonlyValueObjectException());
}
