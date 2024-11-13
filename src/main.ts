import 'loadDomains';
import { container, mongoDriverTokens, userTokens } from 'components';
import { PeriodicWorker } from 'interfaces';

import type { IInterface } from 'shared';
import type { MongoDriver } from 'drivers/mongo';
import type { CreateUserController } from 'app/user';

await container.load();
let selectedInterface: IInterface;

switch (process.env.INTERFACE) {
  case 'periodic': {
    selectedInterface = await container.build(PeriodicWorker);
    break;
  }

  case 'core':
    {
      const driver = await container.get<MongoDriver>(mongoDriverTokens.driver);

      const startDriver = await driver.startDriver();

      startDriver.lazy();

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
