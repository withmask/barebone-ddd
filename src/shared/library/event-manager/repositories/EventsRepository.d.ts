import type { TResult, TVoidResult } from 'shared';

export interface IEvent<D> {
  data: D;

  emittedAt: number;

  emitter: {
    domain: string;
    event: string;
    type: 'domain';
  };

  id: string;
}

export interface IEventRepository {
  deleteEvent(
    event: Omit<IEvent<any>, 'emittedAt' | 'id'>
  ): Promise<TResult<string[]>>;
  getByID(id: string): Promise<TResult<IEvent<any> | null>>;
  purgeCompletedEvents(): Promise<TVoidResult>;
  storeEvent(event: IEvent<any>): Promise<TVoidResult>;
}
