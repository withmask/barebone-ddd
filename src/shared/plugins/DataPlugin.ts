import yaml from 'yaml';
import { Container } from 'components';
import { FailedParsingYAMLException, Result } from 'shared';

import type { TResult } from 'shared';

@Container.injectable()
export class DataPlugin {
  public async parseYAML<ReturnType>(
    data: string
  ): Promise<TResult<ReturnType>> {
    let parsed;
    try {
      parsed = yaml.parse(data);
    } catch (error) {
      return Result.fail(new FailedParsingYAMLException(error));
    }

    return Result.ok(parsed);
  }
}
