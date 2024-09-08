import { Exception } from 'shared';

export class ReadonlyValueObjectException extends Exception<'validation'> {
  public constructor() {
    super('validation');
  }
}
