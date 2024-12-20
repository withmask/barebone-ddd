import { MongoDriver, UserMapper } from 'drivers/mongo';
import { Module, mongoDriverTokens } from 'components';

export const mongoDriverModule = Module.create();

mongoDriverModule.listen((bind) => {
  bind(mongoDriverTokens.driver).to(MongoDriver);

  bind(mongoDriverTokens.mappers.user).to(UserMapper);
});
