import crypto from 'node:crypto';
import { FailedGeneratingUUIDException, Result } from 'shared';
import { Container } from 'components';

import type { TResult } from 'shared';

@Container.injectable()
export class CryptoPlugin {
  public async generateRandomUUID(): Promise<TResult<string>> {
    let uuid: string;

    try {
      uuid = crypto.randomUUID();
    } catch (error) {
      return Result.fail(new FailedGeneratingUUIDException(error));
    }

    return Result.ok(uuid);
  }
}
