import { Result } from 'shared';
import { Container, mongoDriverTokens } from 'components';

import type { MongoDriver } from 'drivers/mongo';
import type { TResult, TVoidResult } from 'shared';
import type { IUserRepository, UserEntity } from 'app/user';

@Container.injectable()
export class MongoUserRepository implements IUserRepository {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _driver: MongoDriver
  ) {}

  private get collection() {
    return this._driver.model('user', 'user');
  }

  public async emailAvailable(email: string): Promise<TResult<boolean>> {
    const documentCount = await this.collection.countDocuments({
      email
    });

    return Result.ok(documentCount === 0);
  }

  public async save(entity: UserEntity): Promise<TVoidResult> {
    await this.collection.updateOne({ _id: entity.id }, {});

    return Result.done();
  }
}
