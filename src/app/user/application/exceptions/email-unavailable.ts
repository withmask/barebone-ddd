import { Exception } from 'shared';

export class EmailUnavailableException extends Exception<'validation'> {
  public constructor() {
    super('validation');
  }
}
