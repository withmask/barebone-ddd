import type { IUserCreatedEvent } from 'app/user';

import type { TEventOptions, TVoidResult } from 'shared';
import { ApplicationEventManager, Result } from 'shared';

@ApplicationEventManager.listener('user')
export class UserSubscribers {
  @ApplicationEventManager.event({ immediate: false })
  public async userCreated(
    event: TEventOptions<IUserCreatedEvent>
  ): Promise<TVoidResult> {
    await event.removeEvent<IUserCreatedEvent>('userCreated', {
      id: event.data.id
    });
    console.log({ event });

    return Result.done();
  }
}
