import { Result } from 'shared';
import { UserEntity } from 'app/user';
import { Container, pluginsTokens } from 'components';

import type { CryptoPlugin, IFactory, IFactoryOptions, TResult } from 'shared';

@Container.injectable()
export class UserFactory implements IFactory<UserEntity> {
  public constructor(
    @Container.inject(pluginsTokens.cryptoPlugin)
    private readonly _cryptoPlugin: CryptoPlugin
  ) {}

  public async createNewOne(
    options: IFactoryOptions<UserEntity>
  ): Promise<TResult<UserEntity>> {
    const generateRandomUUIDResult =
      await this._cryptoPlugin.generateRandomUUID();

    if (generateRandomUUIDResult.failed()) return generateRandomUUIDResult;

    const uuid = generateRandomUUIDResult.value(),
      entity = new UserEntity(
        uuid,
        {
          email: options.properties.email
        },
        {
          name: options.valueObjects.name
        }
      );

    return Result.ok(entity);
  }

  public async createOne(
    options: IFactoryOptions<UserEntity>,
    id: string
  ): Promise<TResult<UserEntity>> {
    const entity = new UserEntity(
      id,
      {
        email: options.properties.email
      },
      {
        name: options.valueObjects.name
      }
    );

    return Result.ok(entity);
  }
}
