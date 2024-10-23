import { CryptoPlugin, DataPlugin } from 'shared';
import { Module, pluginsTokens } from 'components';

export const pluginsModule = Module.create();

pluginsModule.listen((bind) => {
  bind(pluginsTokens.dataPlugin).to(DataPlugin);
  bind(pluginsTokens.cryptoPlugin).to(CryptoPlugin);
});
