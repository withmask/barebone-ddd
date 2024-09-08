import { ConfigParser } from 'shared';
import { Module, libraryTokens } from 'components';

import type { IConfigParser } from 'shared';

export const libraryModule = Module.create();

libraryModule.listen((bind) => {
  bind<IConfigParser>(libraryTokens.configParser).cached().to(ConfigParser);
});
