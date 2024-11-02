import { Exception } from 'shared';

export class NoHandlerFoundException extends Exception<'internal'> {
  public constructor(
    public readonly handler: {
      listener: string;
      method: string;
      type: 'domain';
    }
  ) {
    super('internal');
  }
}
