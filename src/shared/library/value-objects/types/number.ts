import { ValueObject, Result, InvalidValueTypeException } from 'shared';

import type { TValidator } from 'shared';

export class NumberValueObject extends ValueObject<number> {
  protected constructor(validators: TValidator<number>[]) {
    super(validators);

    super.validate((value) => {
      if (typeof value !== 'number')
        return Result.fail(
          new InvalidValueTypeException('number', typeof value)
        );
    });
  }
}
