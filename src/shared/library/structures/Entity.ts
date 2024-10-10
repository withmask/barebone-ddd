import type { TResult } from 'shared';
import type { ValueObject } from 'shared';

export interface IEntityOptions<V, P> {
  properties: P;
  values: V;
}

export class Entity<V, P = null, M = never> {
  public readonly methods: M;
  public readonly values: V;

  private _methods: {
    [key: string]: (...args: any[]) => TResult<any> | Promise<TResult<any>>;
  };
  private readonly _valueObjects: {
    [key: string]: ValueObject<any>;
  };

  public constructor(
    public readonly id: string,
    public readonly properties: P
  ) {
    const self = this;

    this.values = new Proxy(
      {},
      {
        get(_, p): ValueObject<any> {
          if (!(p in self._valueObjects))
            throw new Error(`Undefined value object: ${p as string}`);

          return self._valueObjects[p as string];
        }
      }
    ) as V;
    this.methods = new Proxy(
      {},
      {
        get(_, p): (...args: any) => any {
          if (!(p in self._methods))
            return () => {
              throw new Error('Method undefined:' + (p as string));
            };

          return self._methods[p as string].bind(self._methods);
        }
      }
    ) as M;

    this._valueObjects = {};
    this._methods = {};

    this.id = id;
  }

  protected set<K extends keyof V>(name: K, vo: V[K]): void {
    this._valueObjects[name as string] = vo as any;
  }

  protected setMethods(methods: M): void {
    this._methods = methods as any;
  }
}
