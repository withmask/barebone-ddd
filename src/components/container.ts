import {
  Container,
  libraryModule,
  mongoDriverModule,
  pluginsModule,
  userDomainModule
} from 'components';

export const container = Container.create();

container.listen((load) => {
  load(libraryModule);
  load(mongoDriverModule);
  load(pluginsModule);

  load(userDomainModule);
});
