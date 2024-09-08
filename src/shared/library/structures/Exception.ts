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
}
