import { ConfigParser } from 'shared';
import { Module, libraryTokens } from 'components';

export const libraryModule = Module.create();

libraryModule.listen((bind) => {
  bind(libraryTokens.configParser).cached().to(ConfigParser);
});
