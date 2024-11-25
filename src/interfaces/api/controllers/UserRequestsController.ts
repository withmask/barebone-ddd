import { ApplicationEventManager, Result } from 'shared';
import type { TGetNextEvent, TVoidResult } from 'shared';
import type { IUserCreatedEvent } from 'app/user';

@ApplicationEventManager.externalListener({
  user: ['userCreated']
})
export class UserRequestsController {
  private readonly _eventEmitter!: TGetNextEvent<IUserCreatedEvent>;
  public constructor() {}

  public async getNextEvent(): Promise<TVoidResult> {
    const getNextEventResult = await this._eventEmitter.next();

    if (getNextEventResult.failed()) return getNextEventResult;

    if (getNextEventResult.void()) return Result.done();

    const event = getNextEventResult.value();

    const addEventResult = await this._eventEmitter.finish(event.handler);

    if (addEventResult.failed()) return addEventResult;

    return Result.done();
  }
}
