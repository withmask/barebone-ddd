import type { TDeepPartial, TResult, TVoidResult } from 'shared';

export interface IEventHandler {
  createdAt: number;

  event: string;

  id: string;

  listener: {
    domain: string;
    listener: string;
    type: 'domain';
  };

  state: {
    acquiredAt: number | null;

    failures: number;
    lockedAt: number | null;
  };
}

export interface IEventHandlerRepository {
  addEventHandler(handler: IEventHandler): Promise<TVoidResult>;
  deleteByEvents(ids: string[]): Promise<TVoidResult>;
  deleteEventHandler(id: string): Promise<TVoidResult>;
  getNextEventHandler(): Promise<TResult<IEventHandler | null>>;
  updateEventHandler(
    id: string,
    handler: TDeepPartial<Omit<IEventHandler, 'id'>>
  ): Promise<TVoidResult>;
}
