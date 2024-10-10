import { InvalidNumberRangeException, Result } from 'shared';

import type { TVoidResult } from 'shared';

export function numberLength(min: number | null, max: number | null) {
  if (min === null && max === null)
    throw new Error('Pointless length validation.');

  return function (value: number): TVoidResult {
    if ((min !== null && value < min) || (max !== null && value > max))
      return Result.fail(new InvalidNumberRangeException(min, max, value));
    return Result.done();
  };
}
