import { Container } from 'components';

import { NameValueObject } from 'app/user';

import type {
  ICreateUserController,
  ICreateUserControllerDTO,
  ICreateUserControllerOptions
} from 'app/user';

import type { TResult } from 'shared';

@Container.injectable()
export class CreateUserController implements ICreateUserController {
  public async execute(
    options: ICreateUserControllerOptions
  ): Promise<TResult<ICreateUserControllerDTO>> {
    const nameValueObject = NameValueObject.create();

    const setNameResult = nameValueObject.set(options.name);

    if (setNameResult.failed()) return setNameResult;
  }
}
