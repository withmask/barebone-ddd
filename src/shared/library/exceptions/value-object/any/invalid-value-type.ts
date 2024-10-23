import { Exception } from 'shared';

export class InvalidValueObjectInputTypeException extends Exception<'validation'> {
  public constructor(
    public readonly expected: 'string' | 'number',
    public readonly received: string
  ) {
    super('validation');
  }
}
