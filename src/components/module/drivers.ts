import { MongoDriver } from 'drivers/mongo';
import { Module, driversTokens } from 'components';

import type { IMongoDriver } from 'drivers/mongo';

export const driversModule = Module.create();

driversModule.listen((bind) => {
  bind<IMongoDriver>(driversTokens.mongo).to(MongoDriver);
});
