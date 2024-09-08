import { StringValueObject } from 'shared';
import { isValidName } from '../modifiers';

export class NameValueObject extends StringValueObject {
  private constructor() {
    super([isValidName]);
  }

  public static create(): NameValueObject {
    return new NameValueObject();
  }
}
