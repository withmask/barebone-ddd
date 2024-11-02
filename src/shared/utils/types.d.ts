export type TOmitNever<T> = {
  [K in keyof T as T[K] extends never ? never : K]: T[K];
};

type _Narrow<T, U> = [U] extends [T] ? U : Extract<T, U>;
type TNarrow<T = unknown> =
  | _Narrow<T, 0 | (number & NonNullable<unknown>)>
  | _Narrow<T, 0n | (bigint & NonNullable<unknown>)>
  | _Narrow<T, '' | (string & NonNullable<unknown>)>
  | _Narrow<T, boolean>
  | _Narrow<T, symbol>
  | _Narrow<T, []>
  | _Narrow<T, { [_: PropertyKey]: TNarrow }>
  | (T extends object ? { [K in keyof T]: TNarrow<T[K]> } : never)
  | Extract<NonNullable<unknown> | null | undefined, T>;

type TFallbackValue<K extends keyof F, S, F> = K extends keyof S
  ? S[K] extends undefined
    ? F[K]
    : Exclude<S[K], undefined>
  : F[K];

type TFallBackObject<F, S> = {
  [K in keyof F]: TFallbackValue<K, S, F>;
};

type TOverrideProperty<P extends keyof O, O, V> = Omit<O, P> & { [K in P]: V };

export interface IEmptyObject {}

export type TRemapID<M extends { id: string }> = Omit<M, 'id'> & {
  _id: M['id'];
};

type TDeepPartial<T> = {
  [P in keyof T]?: TDeepPartial<T[P]>;
};
