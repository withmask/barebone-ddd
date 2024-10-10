import {
  Container,
  driversModule,
  libraryModule,
  pluginsModule,
  userDomainModule
} from 'components';

export const container = Container.create();

container.listen((load) => {
  load(libraryModule);
  load(driversModule);
  load(pluginsModule);

  load(userDomainModule);
});
