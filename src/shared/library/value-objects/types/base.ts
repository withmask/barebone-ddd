import type { TResult, TVoidResult } from 'shared';
import { EmptyValueObjectException, Result } from 'shared';

export type TValidator<T> = (value: T) => TVoidResult | void;
export interface TValueObjectValue {
  valueArray: [value?: string];
  version: string;
}

export class ValueObject<T> {
  private internalValidator: TValidator<T>[];
  private value: { value: any } | null;

  protected constructor(private validators: TValidator<T>[]) {
    this.internalValidator = [];

    this.value = null;
  }

  public get defined(): boolean {
    return this.value !== null;
  }

  public get(): TResult<T> {
    if (this.value === null)
      return Result.fail(new EmptyValueObjectException());

    return Result.ok(this.value.value);
  }

  public set(value: T): TVoidResult {
    for (const validate of this.internalValidator) {
      const validateResult = validate.call(this, value);

      if (validateResult === undefined) continue;

      if (validateResult.failed()) return validateResult;
    }

    for (const validate of this.validators) {
      const validateResult = validate.call(this, value);

      if (validateResult === undefined) continue;
      console.log(validateResult.failed());

      if (validateResult.failed()) return validateResult;
    }

    this.value = { value };

    return Result.done();
  }

  protected validate(validator: (value: T) => TVoidResult | void): void {
    this.internalValidator.push(validator);
  }
}
