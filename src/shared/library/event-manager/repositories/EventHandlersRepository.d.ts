import type { TDeepPartial, TResult, TVoidResult } from 'shared';

export interface IEventHandler<
  T extends 'local' | 'external' = 'local' | 'external'
> {
  createdAt: number;

  event: string;

  id: string;

  listener: {
    listener: string;
    name: string;
    type: 'interface' | 'domain' | 'service';
  };

  state: {
    acquiredAt: number | null;

    failures: number;
    lockedAt: number | null;
    type: T;
  };
}

export interface IEventHandlerRepository {
  addEventHandler(handler: IEventHandler): Promise<TVoidResult>;
  countByEvent(id: string): Promise<TResult<number>>;
  deleteByEvents(ids: string[]): Promise<TVoidResult>;
  deleteEventHandler(id: string): Promise<TVoidResult>;
  getNextEventHandler<T extends 'local' | 'external'>(
    type: T,
    listener?: IEventHandler<'external'>['listener']
  ): Promise<TResult<IEventHandler<T> | null>>;
  updateEventHandler(
    id: string,
    handler: TDeepPartial<Omit<IEventHandler, 'id'>>
  ): Promise<TVoidResult>;
}
