import {
  ValueObject,
  Result,
  InvalidValueObjectInputTypeException
} from 'shared';

import type { TValidator } from 'shared';

export class NumberValueObject extends ValueObject<number> {
  protected constructor(validators: TValidator<number>[]) {
    super(validators);

    super.validate((value) => {
      if (typeof value !== 'number')
        return Result.fail(
          new InvalidValueObjectInputTypeException('number', typeof value)
        );
    });
  }
}
