import 'loadDomains';

import { container, mongoDriverTokens, userTokens } from 'components';
import { PeriodicWorker, UserRequestsController } from 'interfaces';

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
      const b = await container.get<MongoDriver>(mongoDriverTokens.driver);

      const z = await b.startDriver();

      z.lazy();

      const user = await container.get<CreateUserController>(
        userTokens.controllers.createUserController
      );

      const rl = await user.execute({
        email: 'with.mask@tutanota.com',
        name: 'With Mask',
        password: 'password'
      });

      rl.lazy();

      const x = await container.build(UserRequestsController);

      let count = 10;
      while (count--) {
        const y = await x.getNextEvent();

        console.log('broke', count, y.lazy());
      }

      process.exit(1);
    }
    // @ts-expect-error Temporary until we release a final version.
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
