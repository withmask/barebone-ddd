import type { TNarrow, Exception, TExceptionKind } from 'shared';

export type TVoidValue = (typeof Result)['_void'];
export type TResult<Type> = Result<Type>;

export type TVoidResult = TResult<TVoidValue>;

export class Result<D> {
  private static readonly _void: unique symbol = Symbol(
    'void_value:3d2ebe91-bdb6-4dd5-b02b-ecaff9b99948'
  );
  private _read: boolean;

  private constructor(
    private readonly _ok: boolean,
    private readonly _value?: D,
    private readonly _error?: Exception<TExceptionKind>
  ) {
    this._read = false;
  }

  public static combined(...results: Result<any>[]): TVoidResult {
    for (const result of results) {
      if (result.failed()) return result;
    }
    return Result.done();
  }

  public static done(): TVoidResult {
    return new Result(true, this._void);
  }

  public static fail(error: Exception<TExceptionKind>): Result<never> {
    return new Result<never>(false, undefined, error);
  }

  public static ok<T>(value: TNarrow<T>): Result<T> {
    return new Result<T>(true, value as T);
  }

  public error(): Exception<TExceptionKind> {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (this._ok) throw new Error('Tried to get error of successful result.');

    return this._error!;
  }

  public failed(): this is Result<never> {
    if (this._read && this._ok)
      throw new Error('Cannot probe successful result status twice.');

    this._read = true;

    return !this._ok;
  }

  public lazy(): D {
    if (this._ok) return this._value as any;

    throw this._error;
  }

  public value(): D {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (!this._ok) throw new Error('Tried to get value of failed result.');

    if (this._value === Result._void)
      throw new Error('This result carries no value.');

    return this._value!;
  }

  public void(): this is Result<TVoidValue> {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (!this._ok) throw new Error('Tried to get value of failed result.');

    return (this._value === Result._void) as boolean;
  }
}
