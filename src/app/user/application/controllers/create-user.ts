import { Container } from 'components';
import { NameValueObject } from 'app/user';
import { ApplicationEventManager, Result } from 'shared';

import type {
  ICreateUserControllerDTO,
  ICreateUserControllerOptions,
  IUserCreatedEvent
} from 'app/user';

import type { TResult } from 'shared';

@Container.injectable()
export class CreateUserController {
  public async execute(
    options: ICreateUserControllerOptions
  ): Promise<TResult<ICreateUserControllerDTO>> {
    const nameValueObject = NameValueObject.create();

    const setNameResult = nameValueObject.set(options.name);

    if (setNameResult.failed()) return setNameResult;

    await ApplicationEventManager.emit<IUserCreatedEvent>('userCreated', {
      id: ''
    });

    const dto: ICreateUserControllerDTO = {
      session: 'login-session'
    };

    return Result.ok(dto);
  }
}
