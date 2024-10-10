import type { IUserRepository } from 'app/user';
import type { MongoDriver } from 'drivers/mongo';

export class MongoUserRepository implements IUserRepository {
  public constructor(private readonly _driver: MongoDriver) {}

  private get collection() {
    return this._driver.model('user', 'user');
  }

  public async save(id: string): Promise<void> {
    await this.collection.updateOne({ _id: id }, {});

    throw new Error('impl missing.');
  }
}
