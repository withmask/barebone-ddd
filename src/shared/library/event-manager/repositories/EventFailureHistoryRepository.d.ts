import type { TExceptionKind, TVoidResult } from 'shared';

export interface IEventFailureHistory {
  event: {
    data: any;

    emittedAt: number;

    emitter: {
      domain: string;
      event: string;
      type: 'domain';
    };

    id: string;
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
    domain: string;
    listener: string;
    type: 'domain';
  };

  state: {
    attempts: number;
  };
}

export interface IEventFailureHistoryRepository {
  saveFailure(event: IEventFailureHistory): Promise<TVoidResult>;
}
