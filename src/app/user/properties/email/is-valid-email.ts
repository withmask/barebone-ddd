import { Exception, Result } from 'shared';

import type { TVoidResult } from 'shared';

class InvalidEmailException extends Exception<'validation'> {
  public constructor(public readonly input: string) {
    super('validation');
  }
}

const emailRegexp =
  /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9-]*\.)+[A-Z]{2,}$/i;

export async function isValidEmail(value: string): Promise<TVoidResult> {
  if (emailRegexp.test(value)) return Result.done();

  return Result.fail(new InvalidEmailException(value));
}
