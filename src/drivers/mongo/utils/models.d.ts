import type {
  IEvent,
  IEventFailureHistory,
  IEventHandler,
  TRemapID
} from 'shared';
import type { IUserDocument } from 'drivers/mongo';

export interface IMongoDriverDomainModels {
  user: {
    session: { _id: string };
    user: IUserDocument;
  };
}

export interface IMongoDriverSharedModels {
  events: {
    event: TRemapID<IEvent<any>>;
    eventFailure: IEventFailureHistory;
    eventHandler: TRemapID<IEventHandler>;
  };
}

export interface IMongoDriverModels {
  domains: IMongoDriverDomainModels;
  shared: IMongoDriverSharedModels;
}
