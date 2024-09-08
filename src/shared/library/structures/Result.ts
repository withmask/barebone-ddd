import type { Exception, TExceptionKind, TNarrow, TOmitNever } from 'shared';

export type TVoidValue = (typeof Result)['_void'];
export type TResult<T> = Result<true, T> | Result<false>;
export type TVoidResult = TResult<TVoidValue>;

export class Result<
  Ok extends boolean,
  Data extends Ok extends false
    ? Exception<TExceptionKind>
    : any = Ok extends false ? Exception<TExceptionKind> : never
> {
  private static readonly _void: unique symbol = Symbol(
    'void_value:3d2ebe91-bdb6-4dd5-b02b-ecaff9b99948'
  );
  private _read: boolean;

  private constructor(
    private readonly _ok: Ok,
    private readonly _data: Data
  ) {
    this._read = false;
  }

  public static combined(...results: TResult<any>[]): TVoidResult {
    for (const result of results) {
      if (result.failed()) return result;
    }

    return Result.done();
  }

  public static done(): TVoidResult {
    return new Result(true, this._void as never);
  }

  public static fail(exception: Exception<TExceptionKind>): Result<false> {
    return new Result(false, exception);
  }

  public static ok<T>(
    value: Exclude<TNarrow<T>, Exception<TExceptionKind>>
  ): TResult<T> {
    return new Result(true, value as T extends TVoidValue ? never : T);
  }

  public static read<P extends { [key: string]: TResult<any> }>(
    results: P
  ): TResult<
    TOmitNever<{
      [K in keyof P]: {
        [T in P[K] as string]: T extends TVoidResult
          ? never
          : T extends TResult<infer V>
            ? V
            : never;
      }[string];
    }>
  > {
    const final: { [key: string]: any } = {};

    for (const key in results) {
      if (Object.prototype.hasOwnProperty.call(results, key)) {
        if (results[key].failed()) return results[key];
        if (results[key].void()) continue;
        final[key as string] = results[key].value();
      }
    }

    return Result.ok(final as any);
  }

  public error(): Ok extends false ? Data : never {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (this._ok) throw new Error('Tried to get error of successful result.');

    return this._data as Ok extends false ? Data : never;
  }

  public failed(): this is Result<false> {
    if (this._read && this._ok)
      throw new Error('Cannot probe successful result status twice.');

    this._read = true;

    return !this._ok;
  }

  public lazy(): Exclude<Data, Exception<TExceptionKind>> {
    if (this._ok) return this._data as any;

    throw this._data;
  }

  public value(): Ok extends true
    ? Data extends TVoidValue
      ? never
      : Data
    : never {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (!this._ok) throw new Error('Tried to get value of failed result.');

    if (this._data === Result._void)
      throw new Error('This result carries no value.');

    return this._data as Ok extends true
      ? Data extends TVoidValue
        ? never
        : Data
      : never;
  }

  public void(): Ok extends true
    ? Data extends TVoidValue
      ? true
      : false
    : never {
    if (!this._read)
      throw new Error('Cannot read result data before probing it.');

    if (!this._ok) throw new Error('Tried to get value of failed result.');

    return (this._data === Result._void) as Ok extends true
      ? Data extends TVoidValue
        ? true
        : false
      : never;
  }
}
