import { Module, userTokens } from 'components';
import { CreateUserController, UserFactory } from 'app/user';
import { MongoUserRepository } from 'drivers/mongo';

export const userDomainModule = Module.create();

userDomainModule.listen((bind) => {
  bind(userTokens.controllers.createUserController).to(CreateUserController);

  bind(userTokens.factories.userFactory).to(UserFactory);

  bind(userTokens.repositories.userRepository).to(MongoUserRepository);
});
