import type { IUserCreatedEvent } from 'app/user';

import type { TEventOptions, TVoidResult } from 'shared';
import { ApplicationEventManager, Result } from 'shared';

@ApplicationEventManager.listener('user')
export class UserSubscribers {
  @ApplicationEventManager.event({ immediate: false })
  public async userCreated(
    event: TEventOptions<IUserCreatedEvent>
  ): Promise<TVoidResult> {
    console.log({ event });

    return Result.done();
  }

  // @ApplicationEventManager.event({ immediate: true })
  // public async userDeleted(
  //   event: TEventOptions<IUserDeletedEvent>
  // ): Promise<TVoidResult> {
  //   const removeEventResult = await event.removeEvent<IUserCreatedEvent>(
  //     'userCreated',
  //     { id: event.data.user }
  //   );

  //   if (removeEventResult.failed()) return removeEventResult;

  //   return Result.done();
  // }
}
