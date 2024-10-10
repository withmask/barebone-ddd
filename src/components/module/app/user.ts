import { Module, userTokens } from 'components';
import { CreateUserController } from 'app/user';

export const userDomainModule = Module.create();

userDomainModule.listen((bind) => {
  bind(userTokens.controllers.createUserController).to(CreateUserController);
});
