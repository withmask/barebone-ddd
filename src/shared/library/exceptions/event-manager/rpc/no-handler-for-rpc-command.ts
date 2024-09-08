import { Exception } from 'shared';

export class NoHandlerForRPCCommandException extends Exception<'internal'> {
  public constructor(
    public readonly command: string,
    public readonly domain: string
  ) {
    super('internal');
  }
}
