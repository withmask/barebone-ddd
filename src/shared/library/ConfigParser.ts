import fs from 'fs';
import path from 'path';
import { constants } from '@constants';
import { Container, pluginsTokens } from 'components';

import type { DataPlugin, IConfig } from 'shared';

@Container.injectable()
export class ConfigParser {
  public config!: IConfig;
  private readonly _config: string;
  public constructor(
    @Container.inject(pluginsTokens.dataPlugin)
    private readonly _dataPlugin: DataPlugin
  ) {
    this._config = path.join(constants.root, '../config.yml');
  }

  @Container.builder()
  protected async build(): Promise<void> {
    const content = await fs.promises.readFile(this._config);

    const parseConfigResult = await this._dataPlugin.parseYAML<IConfig>(
      content.toString()
    );

    this.config = parseConfigResult.lazy();
  }
}
