import { Result } from 'shared';
import { Container, mongoDriverTokens } from 'components';

import type { MongoDriver } from 'drivers/mongo';
import type { IInterface, TVoidResult } from 'shared';

@Container.injectable()
export class APIInterface implements IInterface {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver
  ) {}

  public async boot(): Promise<TVoidResult> {
    const startDriverResult = await this._mongoDriver.startDriver();

    if (startDriverResult.failed()) return startDriverResult;

    return Result.done();
  }

  public async main(): Promise<TVoidResult> {
    return Result.done();
  }
}
