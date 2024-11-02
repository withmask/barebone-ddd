import {
  Container,
  eventsManagerModule,
  libraryModule,
  mongoDriverModule,
  pluginsModule,
  userDomainModule
} from 'components';

export const container = Container.create();

container.listen((load) => {
  load(libraryModule);
  load(eventsManagerModule);
  load(mongoDriverModule);
  load(pluginsModule);

  load(userDomainModule);
});
