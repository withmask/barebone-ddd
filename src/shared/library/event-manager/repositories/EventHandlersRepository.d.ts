import type { TVoidResult } from 'shared';

export interface IEventHandler {
  event: string;

  listener: {
    listener: string;
    type: 'domain';
  };

  state: {
    acquiredAt: number | null;

    failures: number;
    lockedUntil: number | null;

    status: 'EXECUTED' | 'PENDING';
  };
}

export interface IEventHandlerRepository {
  addEventHandler(handler: IEventHandler): Promise<TVoidResult>;
  updateEventHandler(handler: IEventHandler): Promise<TVoidResult>;
}
