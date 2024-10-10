import type { Entity, TResult } from 'shared';

export interface IFactoryOptions<E extends Entity<any, any, any>> {
  properties: E extends Entity<any, infer P, any>
    ? [P] extends [null]
      ? null
      : P
    : null;

  valueObjects: E extends Entity<infer V, any, any>
    ? [V] extends [null]
      ? null
      : V
    : null;
}

export interface IFactory<E extends Entity<any, any, any>> {
  createNewOne?(options: IFactoryOptions<E>): Promise<TResult<E>>;

  createOne?(options: IFactoryOptions<E>, id: string): Promise<TResult<E>>;
}
