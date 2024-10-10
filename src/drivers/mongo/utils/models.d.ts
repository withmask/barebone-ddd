import type { IUserDocument } from 'drivers/mongo';

export interface IMongoDriverModels {
  user: {
    session: { _id: string };
    user: IUserDocument;
  };
}
