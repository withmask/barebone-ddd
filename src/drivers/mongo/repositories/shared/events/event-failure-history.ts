import { Result } from 'shared';

import { Container, mongoDriverTokens } from 'components';
import type { MongoDriver } from 'drivers/mongo';
import type {
  IEventFailureHistory,
  IEventFailureHistoryRepository,
  TVoidResult
} from 'shared';

@Container.injectable()
export class MongoEventFailureHistoryRepository
  implements IEventFailureHistoryRepository
{
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver
  ) {}

  private get collection() {
    return this._mongoDriver.model('shared', 'events', 'eventFailure');
  }

  public async saveFailure(event: IEventFailureHistory): Promise<TVoidResult> {
    await this.collection.insertOne(event);

    return Result.done();
  }
}
