import { Container, mongoDriverTokens } from 'components';
import type { MongoDriver } from 'drivers/mongo';
import {
  ApplicationEventManager,
  Result,
  type IInterface,
  type TVoidResult
} from 'shared';

export class EventProcessor implements IInterface {
  private readonly _break: boolean = false;

  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver
  ) {}

  public async boot(): Promise<TVoidResult> {
    const bootMongoDriverResult = await this._mongoDriver.startDriver();

    if (bootMongoDriverResult.failed()) return bootMongoDriverResult;

    return Result.done();
  }

  public async main(): Promise<TVoidResult> {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const handleNextEvent = await ApplicationEventManager.handleNextEvent();

      if (handleNextEvent.failed()) return handleNextEvent;

      if (this._break) break;
    }

    return Result.done();
  }
}
