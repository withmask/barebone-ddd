import { InvalidValueTypeException, Result, ValueObject } from 'shared';

import type { TValidator, TVoidResult } from 'shared';

export class StringValueObject extends ValueObject<string> {
  protected constructor(validators: TValidator<string>[]) {
    super(validators);

    super.validate((value) => {
      if (typeof value !== 'string')
        return Result.fail(
          new InvalidValueTypeException('string', typeof value)
        );
    });
  }

  public static create(validators: TValidator<string>[]): StringValueObject {
    return new StringValueObject(validators);
  }

  public lowercase(): TVoidResult {
    const getValueResult = this.get();

    if (getValueResult.failed()) return getValueResult;

    const value = getValueResult.value();

    const setValueResult = this.set(value.toLowerCase());

    if (setValueResult.failed()) return setValueResult;

    return Result.done();
  }
}
