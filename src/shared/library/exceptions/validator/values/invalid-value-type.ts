import { Exception } from 'shared';

export class InvalidValueTypeException extends Exception<'validation'> {
  public constructor(
    public readonly prop: string,
    public readonly received: string,
    public readonly expected: string
  ) {
    super('validation');
  }
}
