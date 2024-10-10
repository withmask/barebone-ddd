import { isValidName } from 'app/user';

import { StringValueObject } from 'shared';

export class NameValueObject extends StringValueObject {
  private constructor() {
    super([isValidName]);
  }

  public static create(): NameValueObject {
    return new NameValueObject();
  }
}
