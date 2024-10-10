import { Entity } from 'shared';

import type { NameValueObject } from 'app/user';

export interface IUserEntityValues {
  name: NameValueObject;
}

export class UserEntity extends Entity<IUserEntityValues> {
  public constructor(props: IUserEntityValues, id: string) {
    super(id, null);

    super.set('name', props.name);
  }
}
