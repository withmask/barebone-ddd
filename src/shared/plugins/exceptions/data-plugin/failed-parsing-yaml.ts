import { Exception } from 'shared';

export class FailedParsingYAMLException extends Exception<'validation'> {
  public constructor(public readonly error: any) {
    super('validation');
  }
}
