import { Result } from 'shared';
import { Container } from 'components';
import { NameValueObject, UserEntity } from 'app/user';

import type { IUserDocument } from 'drivers/mongo';
import type { IBaseMapper, TResult } from 'shared';

@Container.injectable()
export class UserMapper implements IBaseMapper<IUserDocument, UserEntity> {
  public async fromPersistance(
    document: IUserDocument
  ): Promise<TResult<UserEntity>> {
    const nameVO = NameValueObject.create();

    const updateNameVOResult = nameVO.set(document.name);

    if (updateNameVOResult.failed()) return updateNameVOResult;

    const entity = new UserEntity(
      document._id,
      {
        email: document.email
      },
      { name: nameVO }
    );

    return Result.ok(entity);
  }

  public async toPersistance(
    entity: UserEntity
  ): Promise<TResult<IUserDocument>> {
    const readNameResult = entity.values.name.get();

    if (readNameResult.failed()) return readNameResult;

    const name = readNameResult.value();

    const doc: IUserDocument = {
      _id: entity.id,
      email: entity.properties.email,
      name
    };

    return Result.ok(doc);
  }
}
