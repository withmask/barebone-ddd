import mongodb from 'mongodb';
import { Container, libraryTokens } from 'components';

import type { IMongoDriverModels } from 'drivers/mongo';
import {
  Result,
  type ConfigParser,
  type IBaseDriver,
  type TVoidResult
} from 'shared';

@Container.injectable()
export class MongoDriver implements IBaseDriver {
  private _connections: { [connection: string]: mongodb.MongoClient };

  public constructor(
    @Container.inject(libraryTokens.configParser)
    private readonly _configParser: ConfigParser
  ) {
    this._connections = {};
  }

  public getCollectionName<
    T extends keyof IMongoDriverModels,
    D extends keyof IMongoDriverModels[T],
    R extends keyof IMongoDriverModels[T][D]
  >(
    type: T,
    domain: D,
    repo: R
  ): { collection: string; database: string; instance: string } {
    const instance = Object.entries(
      this._configParser.config.drivers.mongo.connections
    ).find((v) => v[1][type][domain].some((v) => repo in v.collections));

    if (!instance)
      throw new Error(
        `No instance to handle repo ${repo as string} for ${type} ${domain as string}`
      );

    const { collections, database } = Array.isArray(instance[1][type][domain])
        ? instance[1][type][domain].find((v) => repo in v.collections)!
        : instance[1][type][domain],
      collection = collections[repo as keyof typeof collections];

    return { database, collection, instance: instance[0] };
  }

  public model<
    T extends keyof IMongoDriverModels,
    D extends keyof IMongoDriverModels[T],
    R extends keyof IMongoDriverModels[T][D]
  >(
    type: T,
    domain: D,
    repo: R
  ): mongodb.Collection<
    IMongoDriverModels[T][D][R] extends mongodb.Document
      ? IMongoDriverModels[T][D][R]
      : never
  > {
    const { instance, collection, database } = this.getCollectionName(
      type,
      domain,
      repo
    );

    const connection = this._connections[instance];

    if (connection === undefined)
      throw new Error(`No connection found for: ${instance}`);

    let formattedName = collection.toLowerCase();

    if (!formattedName.endsWith('s')) formattedName += 's';

    return connection!.db(database).collection(collection) as any;
  }

  public async startDriver(): Promise<TVoidResult> {
    console.log('debug', 'Starting mongodb driver.', null);
    await this.connect();
    return Result.done();
  }

  public async stopDriver(): Promise<TVoidResult> {
    for (const connection of Object.values(this._connections)) {
      await connection.close();
    }

    this._connections = {};

    return Result.done();
  }

  private async connect(): Promise<void> {
    for (const connectionName in this._configParser.config.drivers.mongo
      .connections) {
      if (
        Object.prototype.hasOwnProperty.call(
          this._configParser.config.drivers.mongo.connections,
          connectionName
        )
      ) {
        console.log('MongoDB Connecting to:', connectionName);
        const element =
          this._configParser.config.drivers.mongo.connections[connectionName];

        const client = new mongodb.MongoClient(process.env[element.uri]!);

        await client.connect();

        this._connections[connectionName] = client;
      }
    }
  }
}
