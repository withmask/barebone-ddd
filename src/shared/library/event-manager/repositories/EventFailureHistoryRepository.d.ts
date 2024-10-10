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
