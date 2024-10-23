import { Container, pluginsTokens } from 'components';
import { UserSessionEntity } from 'app/user';

import {
  Result,
  type CryptoPlugin,
  type IFactory,
  type IFactoryOptions,
  type TResult
} from 'shared';

@Container.injectable()
export class UserSessionFactory implements IFactory<UserSessionEntity> {
  public constructor(
    @Container.inject(pluginsTokens.cryptoPlugin)
    private readonly _cryptoPlugin: CryptoPlugin
  ) {}

  public async createNewOne(
    options: IFactoryOptions<UserSessionEntity>
  ): Promise<TResult<UserSessionEntity>> {
    const generateRandomUUIDResult =
      await this._cryptoPlugin.generateRandomUUID();

    if (generateRandomUUIDResult.failed()) return generateRandomUUIDResult;

    const uuid = generateRandomUUIDResult.value(),
      entity = new UserSessionEntity(uuid, {
        createdAt: options.properties.createdAt,
        user: options.properties.user
      });

    return Result.ok(entity);
  }
}
