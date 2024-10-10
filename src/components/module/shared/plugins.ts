import { Module, pluginsTokens } from 'components';
import { DataPlugin } from 'shared';

export const pluginsModule = Module.create();

pluginsModule.listen((bind) => {
  bind(pluginsTokens.dataPlugin).to(DataPlugin);
});
