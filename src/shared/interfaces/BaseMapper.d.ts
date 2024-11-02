import type { Entity, TResult } from 'shared';

export interface IBaseMapper<D, E extends Entity<any, any, any>> {
  fromPersistance(document: D): Promise<TResult<E>>;
  toPersistance(entity: E): Promise<TResult<D>>;
}
