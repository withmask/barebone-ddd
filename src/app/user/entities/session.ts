import { Entity } from 'shared';

interface IUserSessionProperties {
  createdAt: number;
  user: string;
}

export class UserSessionEntity extends Entity<null, IUserSessionProperties> {}
