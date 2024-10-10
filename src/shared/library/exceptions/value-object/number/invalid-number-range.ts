import { Exception } from 'shared';

export class InvalidNumberRangeException extends Exception<'validation'> {
  public constructor(
    public readonly min: number | null,
    public readonly max: number | null,
    public readonly value: number
  ) {
    super('validation');
  }
}
