import type { TResult } from 'shared';

export interface ICreateUserControllerOptions {
  email: string;
  name: string;

  password: string;
}

export interface ICreateUserControllerDTO {
  session: string;
}

export interface ICreateUserController {
  execute(
    options: ICreateUserControllerOptions
  ): Promise<TResult<ICreateUserControllerDTO>>;
}
