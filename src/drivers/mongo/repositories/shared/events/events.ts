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

  public async deleteEvent(
    event: TDeepPartial<Omit<IEvent<any>, 'emittedAt' | 'id'>>
  ): Promise<TResult<string[]>> {
    const result = this.collection
      .find(flattenMatch(event))
      .project({ _id: 1 });

    const ids: string[] = [];

    for await (const document of result) {
      ids.push(document._id);
    }

    await this.collection.deleteMany({ _id: { $in: ids } });

    return Result.ok(ids);
  }

  public async getByID(id: string): Promise<TResult<IEvent<any> | null>> {
    const document = await this.collection.findOne({ _id: id });

    if (document === null) return Result.ok(null);

    const { _id, ...toReturn } = document;

    return Result.ok({ id, ...toReturn });
  }

  public async purgeCompletedEvents(): Promise<TVoidResult> {
    const { collection } = this._mongoDriver.getCollectionName(
      'shared',
      'events',
      'eventHandler'
    );

    let queue: string[] = [];

    for await (const doc of this.collection.aggregate<{ _id: string }>([
      {
        $lookup: {
          from: collection,
          localField: '_id',
          foreignField: 'event',
          as: 'handlers'
        }
      },
      {
        $match: {
          handlers: {
            $size: 0
          }
        }
      },
      {
        $project: {
          _id: 1
        }
      }
    ])) {
      queue.push(doc._id);
      if (queue.length > 100) {
        await this.collection.deleteMany({
          _id: { $in: queue }
        });

        queue = [];
      }
    }

    if (queue.length > 0) {
      await this.collection.deleteMany({
        _id: { $in: queue }
      });
    }

    return Result.done();
  }

  public async storeEvent(event: IEvent<any>): Promise<TVoidResult> {
    const { id, ...toInsert } = event;

    await this.collection.insertOne({ _id: id, ...toInsert });

    return Result.done();
  }
}
