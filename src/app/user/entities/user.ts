import { Entity } from 'shared';

import type { StringValueObject } from 'shared';

export interface IUserEntityValues {
  name: StringValueObject;
}

export class UserEntity extends Entity<IUserEntityValues> {
  protected constructor(props: IUserEntityValues, id: string) {
    super(id, null);

    super.set('name', props.name);
  }
}
