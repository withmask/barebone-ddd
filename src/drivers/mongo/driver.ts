import mongoose from 'mongoose';
import { Container } from 'components';
import { mongooseUserSchema } from 'drivers/mongo';

import type { IKnownModels, IMongoDriver } from 'drivers/mongo';

@Container.injectable()
export class MongoDriver implements IMongoDriver {
  private _models: {
    [K in keyof IKnownModels]: mongoose.Schema<IKnownModels[K]>;
  };
  private _mongoClient: mongoose.Connection | null;

  public constructor() {
    this._mongoClient = null;
    this._models = {
      user: mongooseUserSchema
    };
  }

  public model<K extends keyof IKnownModels>(
    name: K
  ): mongoose.Model<IKnownModels[K]> {
    //@TODO Awful, just fucking disgusting.
    if (this._mongoClient === null) {
      console.log(
        'warn',
        'Supplying shadow model. Database was not initiated before this call. Are we in an ephemeral environment ?',
        null
      );
      console.log(
        'warn',
        'This is awful behaviour and should be replaced by delaying the mongodb connection until requested while still providing a constructed class.',
        null
      );

      return new Proxy(Object.create(null), {
        get(_, p): never {
          throw new Error(
            `Cannot execute operation ${p.toString()} on shadow model.`
          );
        }
      });
    }

    let formattedName = name.toLowerCase();

    if (!formattedName.endsWith('s')) formattedName += 's';

    return this._mongoClient!.model<IKnownModels[K]>(formattedName) as any;
  }

  public async startDriver(): Promise<void> {
    console.log('debug', 'Starting mongodb driver.', null);
    await this.connect();
    return;
  }

  public async stopDriver(): Promise<void> {
    await this._mongoClient!.close(true);
    this._mongoClient = null;
  }

  private async connect(): Promise<void> {
    this._mongoClient = mongoose.createConnection(process.env.MONGO_URI, {
      dbName: process.env.MONGO_DATABASE
    });

    for (const key in this._models) {
      if (Object.prototype.hasOwnProperty.call(this._models, key)) {
        const schema = this._models[key as keyof typeof this._models];
        this._mongoClient.model(key, schema);
      }
    }

    await this._mongoClient.asPromise();
  }
}
