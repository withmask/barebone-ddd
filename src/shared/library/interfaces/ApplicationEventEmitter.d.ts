import type { TExceptionKind } from 'shared';

export interface IEventFailureHistory {
  event: {
    createdAt: number;
    data: any;
    emitter: string;
    id: string;
    name: string;
  };

  failure: {
    data:
      | { error: string; type: 'THROW' }
      | {
          exception: {
            details: { [key: string]: any };
            kind: TExceptionKind;
            name: string;
          };
          type: 'EXCEPTION';
        };
    date: number;
  };

  handler: {
    domain: 'string';
    name: 'string';

    state: {
      attempts: number;
    };
  };
}

export interface IQueuedEvent {
  createdAt: number;
  data: any;
  emitter: string;
  id: string;
  name: string;
}

export interface IQueuedHandlerEvent {
  event: string;

  handler: {
    conditions: {
      [key: string]: string;
    };

    domain: string;
    name: string;
  };

  id: string;

  state: {
    attempts: number;
    failed: boolean;
    lockedUntil: number | null;
    success: boolean;
  };
}
