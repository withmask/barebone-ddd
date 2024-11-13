import util from 'util';

export type TExceptionKind =
  | 'persistance'
  | 'unknown'
  | 'validation'
  | 'internal'
  | 'external';

export class Exception<Kind extends TExceptionKind> {
  public readonly name: string;

  protected constructor(public readonly kind: Kind) {
    this.name = this.constructor.name;
  }

  public static is<
    Error extends new (...args: any[]) => Exception<TExceptionKind>
  >(
    error: Exception<TExceptionKind>,
    instance: Error
  ): error is Error extends new (...args: any[]) => infer I ? I : never {
    return error.constructor.name === instance.name;
  }

  public toJSON(): { [key: string]: any } {
    const result: { [key: string]: any } = {};

    for (const prop in this) {
      if (prop === 'name' || prop === 'kind') continue;
      if (Object.prototype.hasOwnProperty.call(this, prop)) {
        const value = this[prop];

        switch (typeof value) {
          case 'boolean':
          case 'number':
          case 'string':
            result[prop] = value;
            break;

          case 'object':
            if (value === null) result[prop] = null;
            else if (value instanceof Exception) result[prop] = value.toJSON();
            else if ('toJSON' in value && typeof value.toJSON === 'function')
              result[prop] = value.toJSON();
            else result[prop] = util.inspect(value);
            break;

          case 'bigint':
          case 'function':
          case 'symbol':
          case 'undefined':
            result[prop] = util.inspect(value);
            break;
        }
      }
    }

    return result;
  }
}
