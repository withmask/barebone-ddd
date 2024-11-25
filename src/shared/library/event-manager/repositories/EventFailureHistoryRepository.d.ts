import type { TExceptionKind, TVoidResult } from 'shared';

export interface IEventFailureHistory {
  event: {
    data: any;

    emittedAt: number;

    emitter: {
      event: string;
      name: string;
      type: 'domain' | 'service';
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
    listener: string;
    name: string;
    type: 'interface' | 'domain' | 'service';
  };

  state: {
    attempts: number;
  };
}

export interface IEventFailureHistoryRepository {
  saveFailure(event: IEventFailureHistory): Promise<TVoidResult>;
}
