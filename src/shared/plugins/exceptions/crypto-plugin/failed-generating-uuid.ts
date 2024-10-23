import { Exception } from 'shared';

export class FailedGeneratingUUIDException extends Exception<'internal'> {
  public constructor(public readonly error: any) {
    super('internal');
  }
}
