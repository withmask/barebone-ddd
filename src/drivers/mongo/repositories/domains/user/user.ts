import { Result } from 'shared';
import { Container, mongoDriverTokens } from 'components';

import type { MongoDriver, UserMapper } from 'drivers/mongo';
import type { TResult, TVoidResult } from 'shared';
import type { IUserRepository, UserEntity } from 'app/user';

@Container.injectable()
export class MongoUserRepository implements IUserRepository {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _driver: MongoDriver,
    @Container.inject(mongoDriverTokens.mappers.user)
    private readonly _userMapper: UserMapper
  ) {}

  private get collection() {
    return this._driver.model('domains', 'user', 'user');
  }

  public async emailAvailable(email: string): Promise<TResult<boolean>> {
    const documentCount = await this.collection.countDocuments({
      email
    });

    return Result.ok(documentCount === 0);
  }

  public async save(entity: UserEntity): Promise<TVoidResult> {
    const toPersistanceResult = await this._userMapper.toPersistance(entity);

    if (toPersistanceResult.failed()) return toPersistanceResult;

    const doc = toPersistanceResult.value();

    console.log({ doc });
    // await this.collection.updateOne(
    //   { _id: entity.id },
    //   { $set: doc },
    //   { upsert: true }
    // );

    return Result.done();
  }
}
