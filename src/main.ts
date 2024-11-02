import { container, mongoDriverTokens, userTokens } from 'components';
import type { IInterface } from 'shared';
import { EventProcessor } from 'interfaces';
import 'loadDomains';
import type { CreateUserController } from 'app/user';
import type { MongoDriver } from 'drivers/mongo';

await container.load();
let selectedInterface: IInterface;

switch (process.env.INTERFACE) {
  case 'event-processor': {
    selectedInterface = await container.build(EventProcessor);
    break;
  }

  case 'core':
    {
      const driver = await container.get<MongoDriver>(mongoDriverTokens.driver);

      const y = await driver.startDriver();

      console.log(y.lazy());

      const userController = await container.get<CreateUserController>(
        userTokens.controllers.createUserController
      );

      const result = await userController.execute({
        email: 'with.mask@tutanota.com',
        name: 'Hello world',
        password: 'Cool password'
      });

      console.log(result.lazy());
      process.exit(1);
    }
    //@ts-expect-error Because ts is dumb
    break;

  default:
    console.log('Unknown interface:', process.env.INTERFACE);
    process.exit(1);
}

if (typeof selectedInterface.boot === 'function') {
  const bootResult = await selectedInterface.boot();

  bootResult.lazy();
}

const mainResult = await selectedInterface.main();

mainResult.lazy();
