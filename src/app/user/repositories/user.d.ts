import type { UserEntity } from 'app/user';
import type { TVoidResult, TResult } from 'shared';

export interface IUserRepository {
  emailAvailable(email: string): Promise<TResult<boolean>>;
  save(entity: UserEntity): Promise<TVoidResult>;
}
