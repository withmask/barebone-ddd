import { Result } from 'shared';
import { flattenMatch } from 'drivers/mongo';
import { Container, libraryTokens, mongoDriverTokens } from 'components';

import type { MongoDriver } from 'drivers/mongo';
import type {
  TDeepPartial,
  IEventHandler,
  IEventHandlerRepository,
  TVoidResult,
  TResult,
  ConfigParser
} from 'shared';

@Container.injectable()
export class MongoEventHandlerRepository implements IEventHandlerRepository {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver,
    @Container.inject(libraryTokens.configParser)
    private readonly _configParser: ConfigParser
  ) {}

  private get collection() {
    return this._mongoDriver.model('shared', 'events', 'eventHandler');
  }

  public async addEventHandler(handler: IEventHandler): Promise<TVoidResult> {
    const { id, ...toInsert } = handler;

    await this.collection.insertOne({ _id: id, ...toInsert });

    return Result.done();
  }

  public async deleteByEvents(ids: string[]): Promise<TVoidResult> {
    await this.collection.deleteMany({
      event: {
        $in: ids
      }
    });

    return Result.done();
  }

  public async deleteEventHandler(id: string): Promise<TVoidResult> {
    await this.collection.deleteMany({
      _id: id
    });

    return Result.done();
  }

  public async getNextEventHandler(): Promise<TResult<IEventHandler | null>> {
    await this.collection.bulkWrite([
      {
        updateMany: {
          filter: {
            'state.acquiredAt': {
              $lt:
                Date.now() -
                this._configParser.config.shared.eventManager.eventTimeoutPeriod
            }
          },
          update: {
            $set: {
              'state.acquiredAt': null
            }
          }
        }
      },
      {
        updateMany: {
          filter: {
            'state.lockedAt': {
              $lt:
                Date.now() -
                this._configParser.config.shared.eventManager
                  .eventFailureLockPeriod
            }
          },
          update: {
            $set: {
              'state.lockedAt': null
            }
          }
        }
      }
    ]);

    const nextHandler = await this.collection.findOneAndUpdate(
      {
        'state.acquiredAt': null,
        'state.lockedAt': null
      },
      {
        $set: {
          'state.acquiredAt': Date.now()
        }
      },
      {
        sort: {
          createdAt: 1
        }
      }
    );

    if (nextHandler === null) return Result.ok(null);

    const { _id: id, ...handler } = nextHandler;

    return Result.ok({
      id,
      ...handler
    });
  }

  public async updateEventHandler(
    id: string,
    handler: TDeepPartial<Omit<IEventHandler, 'id'>>
  ): Promise<TVoidResult> {
    await this.collection.updateOne(
      {
        _id: id
      },
      {
        $set: flattenMatch(handler)
      }
    );

    return Result.done();
  }
}
