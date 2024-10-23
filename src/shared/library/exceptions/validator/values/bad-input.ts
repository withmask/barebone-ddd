import { Exception } from 'shared';

import type { TExceptionKind } from 'shared';

export class BadInputException extends Exception<'validation'> {
  public constructor(
    public readonly prop: string,
    public readonly error: Exception<TExceptionKind>
  ) {
    super('validation');
  }
}
