import { MongoDriver } from 'drivers/mongo';
import { Module, driversTokens } from 'components';

export const driversModule = Module.create();

driversModule.listen((bind) => {
  bind(driversTokens.mongo).to(MongoDriver);
});
