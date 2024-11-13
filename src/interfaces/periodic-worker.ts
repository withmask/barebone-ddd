import { Result } from 'shared';
import { Container, libraryTokens, mongoDriverTokens } from 'components';

import type { MongoDriver } from 'drivers/mongo';
import type { PeriodicManager, IInterface, TVoidResult } from 'shared';

export class PeriodicWorker implements IInterface {
  public constructor(
    @Container.inject(mongoDriverTokens.driver)
    private readonly _mongoDriver: MongoDriver,
    @Container.inject(libraryTokens.periodicManager)
    private readonly _periodicManager: PeriodicManager
  ) {}

  public async boot(): Promise<TVoidResult> {
    const bootMongoDriverResult = await this._mongoDriver.startDriver();

    if (bootMongoDriverResult.failed()) return bootMongoDriverResult;

    return Result.done();
  }

  public async main(): Promise<TVoidResult> {
    this._periodicManager.startJobs();

    return Result.done();
  }
}
