import { Container, driversModule, userDomainModule } from '.';

export const container = Container.create();

container.listen((load) => {
  load(driversModule);

  load(userDomainModule);
});
