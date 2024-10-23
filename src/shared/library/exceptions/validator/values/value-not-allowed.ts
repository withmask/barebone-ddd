import { Exception } from 'shared';

export class ValueNotAllowedException extends Exception<'validation'> {
  public constructor(
    public readonly prop: string,
    public readonly value: any
  ) {
    super('validation');
  }
}
