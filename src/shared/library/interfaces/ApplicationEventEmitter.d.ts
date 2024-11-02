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
    lockedAt: number | null;
    success: boolean;
  };
}
