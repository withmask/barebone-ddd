import type { TResult, TVoidResult } from 'shared';

export interface IEvent<D> {
  data: D;

  emittedAt: number;

  emitter: {
    event: string;
    name: string;
    type: 'domain';
  };

  id: string;
}

export interface IEventRepository {
  all(): AsyncGenerator<TResult<IEvent<any>>>;
  deleteEvent(
    event: Omit<IEvent<any>, 'emittedAt' | 'id'>
  ): Promise<TVoidResult>;
  deleteEvents(events: string[]): Promise<TVoidResult>;
  getByID(id: string): Promise<TResult<IEvent<any> | null>>;
  storeEvent(event: IEvent<any>): Promise<TVoidResult>;
}
