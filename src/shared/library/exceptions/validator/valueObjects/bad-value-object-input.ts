import { Exception } from 'shared';

export class BadValueObjectInput extends Exception<'validation'> {
  public constructor(
    public readonly error: Exception<any>,
    public readonly prop: string
  ) {
    super('validation');
  }
}
