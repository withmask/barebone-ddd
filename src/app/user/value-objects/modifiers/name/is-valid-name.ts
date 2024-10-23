import { Result } from 'shared';
import { Container, libraryTokens } from 'components';

import type { TVoidResult, ConfigParser } from 'shared';

import { Exception } from 'shared';

export class InvalidNameLengthException extends Exception<'validation'> {
  public constructor(
    public readonly rangeLength: [number, number],
    public readonly provided: number
  ) {
    super('validation');
  }
}

export function isValidName(name: string): TVoidResult {
  const configParser = Container.cached<ConfigParser>(
    libraryTokens.configParser
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
