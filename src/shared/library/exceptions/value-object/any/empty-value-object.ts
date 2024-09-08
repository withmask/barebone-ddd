import { Exception } from 'shared';

export class EmptyValueObjectException extends Exception<'validation'> {
  public constructor() {
    super('validation');
  }
}
