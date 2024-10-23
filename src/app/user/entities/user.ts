import { Entity } from 'shared';

import type { NameValueObject } from 'app/user';

export interface IUserEntityProperties {
  email: string;
}

export interface IUserEntityValues {
  name: NameValueObject;
}

export class UserEntity extends Entity<
  IUserEntityValues,
  IUserEntityProperties
> {
  public constructor(
    id: string,
    properties: IUserEntityProperties,
    values: IUserEntityValues
  ) {
    super(id, properties);

    super.set('name', values.name);
  }
}
