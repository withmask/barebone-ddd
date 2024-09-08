import fs from 'fs';
import url from 'url';
import path from 'path';

import { Container, pluginsTokens } from 'components';
import type { IConfigParser, IDataPlugin, IConfig } from 'shared';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

@Container.injectable()
export class ConfigParser implements IConfigParser {
  public config!: IConfig;
  public readonly root: string;
  private readonly _config: string;
  public constructor(
    @Container.inject(pluginsTokens.data)
    private readonly _dataPlugin: IDataPlugin
  ) {
    this.root = path.join(__dirname, '../../');
    this._config = path.join(this.root, '../config.yml');
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
