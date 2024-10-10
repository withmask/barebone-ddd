import type { IUserCreatedEvent } from 'app/user';

import type { TImmediateEventOptions, TVoidResult } from 'shared';
import { ApplicationEventManager, Result } from 'shared';

@ApplicationEventManager.listener('user')
export class UserSubscribers {
  @ApplicationEventManager.event({ immediate: true })
  public async userCreated(
    event: TImmediateEventOptions<IUserCreatedEvent>
  ): Promise<TVoidResult> {
    console.log({ event });

    return Result.done();
  }
}
