import { Result } from 'shared';
import { Container } from 'components';
import { libraryTokens } from 'components/tokens/library';

import type { TVoidResult, IConfigParser } from 'shared';
import { InvalidNameLengthException } from './exceptions';

export function isValidName(name: string): TVoidResult {
  const configParser = Container.cached<IConfigParser>(
    libraryTokens.configParser
  );

  if (
    name.length >
      configParser.config.app.domains.user.rules.name.maxNameLength ||
    name.length <
      configParser.config.app.domains.user.rules.name.minNumberLength
  )
    return Result.fail(
      new InvalidNameLengthException(
        [
          configParser.config.app.domains.user.rules.name.minNumberLength,
          configParser.config.app.domains.user.rules.name.maxNameLength
        ],
        name.length
      )
    );

  return Result.done();
}
