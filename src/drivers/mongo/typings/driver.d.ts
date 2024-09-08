import type mongoose from 'mongoose';
import type { IDriver } from 'shared';
import type { IUserDocument } from 'drivers/mongo';

export interface IKnownModels {
  user: IUserDocument;
}

export interface IMongoDriver extends IDriver {
  model<K extends keyof IKnownModels>(name: K): mongoose.Model<IKnownModels[K]>;
}
