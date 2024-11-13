import { Result } from 'shared';
import { Container, mongoDriverTokens } from 'components';

import { flattenMatch, type MongoDriver } from 'drivers/mongo';
import type {
  IEvent,
  IEventRepository,
  TDeepPartial,
  TResult,
  TVoidResult
} from 'shared';

@Container.injectable()
export class MongoEventRepository implements IEventRepository {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver
  ) {}

  private get collection() {
    return this._mongoDriver.model('shared', 'events', 'event');
  }

  public async *all(): AsyncGenerator<TResult<IEvent<any>>> {
    for await (const event of this.collection.find()) {
      const { _id: id, ...e } = event;
      yield Result.ok({ ...e, id });
    }
  }

  public async deleteEvent(
    event: TDeepPartial<Omit<IEvent<any>, 'emittedAt' | 'id'>>
  ): Promise<TVoidResult> {
    const result = this.collection
      .find(flattenMatch(event))
      .project({ _id: 1 });

    let ids: string[] = [];

    for await (const document of result) {
      ids.push(document._id);

      if (ids.length === 100) {
        const deleteManyResult = await this.deleteEvents(ids);

        if (deleteManyResult.failed()) return deleteManyResult;

        ids = [];
      }
    }

    if (ids.length) {
      const deleteManyResult = await this.deleteEvents(ids);

      if (deleteManyResult.failed()) return deleteManyResult;
    }

    return Result.done();
  }

  public async deleteEvents(events: string[]): Promise<TVoidResult> {
    await this.collection.deleteMany({ _id: { $in: events } });

    return Result.done();
  }

  public async getByID(id: string): Promise<TResult<IEvent<any> | null>> {
    const document = await this.collection.findOne({ _id: id });

    if (document === null) return Result.ok(null);

    const { _id, ...toReturn } = document;

    return Result.ok({ id, ...toReturn });
  }

  public async storeEvent(event: IEvent<any>): Promise<TVoidResult> {
    const { id, ...toInsert } = event;

    await this.collection.insertOne({ _id: id, ...toInsert });

    return Result.done();
  }
}
