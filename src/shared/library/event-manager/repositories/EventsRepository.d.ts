import type { TVoidResult } from 'shared';

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
  storeEvent(event: IEvent<any>): Promise<TVoidResult>;
}
