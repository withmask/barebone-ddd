import type { CreateUserController } from 'app/user';
import { container, mongoDriverTokens, userTokens } from 'components';
import type { MongoDriver } from 'drivers/mongo';

await container.load();

const m = await container.get<MongoDriver>(mongoDriverTokens.driver);

await m.startDriver();

const x = await container.get<CreateUserController>(
  userTokens.controllers.createUserController
);

const y = await x.execute({
  email: 'with.mask@tutanota.com',
  name: 'Good Morning',
  password: 'Cool password'
});

console.log(y.lazy());
