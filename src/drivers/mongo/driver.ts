import mongodb from 'mongodb';
import { Container, libraryTokens } from 'components';

import type { IMongoDriverModels } from 'drivers/mongo';
import type { ConfigParser, IBaseDriver } from 'shared';

@Container.injectable()
export class MongoDriver implements IBaseDriver {
  private _connections: { [connection: string]: mongodb.MongoClient };

  public constructor(
    @Container.inject(libraryTokens.configParser)
    private readonly _configParser: ConfigParser
  ) {
    this._connections = {};
  }

  public model<
    D extends keyof IMongoDriverModels,
    R extends keyof IMongoDriverModels[D]
  >(
    domain: D,
    repo: R
  ): mongodb.Collection<
    IMongoDriverModels[D][R] extends mongodb.Document
      ? IMongoDriverModels[D][R]
      : never
  > {
    const instance = Object.entries(
      this._configParser.config.drivers.mongo.connections
    ).find(
      (v) =>
        domain in v[1].domains &&
        v[1].domains[domain].some((v) => repo in v.collections)
    );

    if (!instance)
      throw new Error(
        `No instance to handle repo ${repo as string} for ${domain}`
      );

    const { collections, database } = instance[1].domains[domain].find(
        (v) => repo in v.collections
      )!,
      collection = collections[repo as keyof typeof collections];

    const connection = this._connections[instance[0]];

    if (connection === undefined)
      throw new Error(`No connection found for: ${instance[0]}`);

    let formattedName = collection.toLowerCase();

    if (!formattedName.endsWith('s')) formattedName += 's';

    return connection!.db(database).collection(collection) as any;
  }

  public async startDriver(): Promise<void> {
    console.log('debug', 'Starting mongodb driver.', null);
    await this.connect();
    return;
  }

  public async stopDriver(): Promise<void> {
    for (const connection of Object.values(this._connections)) {
      await connection.close();
    }

    this._connections = {};
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
