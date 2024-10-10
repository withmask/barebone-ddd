import { Result } from 'shared';
import { Container, libraryTokens } from 'components';

import type { TVoidResult, ConfigParser } from 'shared';
import { InvalidNameLengthException } from 'app/user';

export function isValidName(name: string): TVoidResult {
  const configParser = Container.cached<ConfigParser>(
    libraryTokens.configParser
  );
  console.log(
    JSON.stringify(
      {
        configParser,
        max: configParser.config.app.domains.user.rules.name.maxNameLength,
        l: name.length,
        min: configParser.config.app.domains.user.rules.name.minNameLength
      },
      null,
      1
    )
  );

  if (
    name.length >
      configParser.config.app.domains.user.rules.name.maxNameLength ||
    name.length < configParser.config.app.domains.user.rules.name.minNameLength
  ) {
    return Result.fail(
      new InvalidNameLengthException(
        [
          configParser.config.app.domains.user.rules.name.minNameLength,
          configParser.config.app.domains.user.rules.name.maxNameLength
        ],
        name.length
      )
    );
  }
  return Result.done();
}
