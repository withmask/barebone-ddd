import type zod from 'zod';
// import sort from 'sort-route-paths';
import { Container } from 'components';

export interface IRouteConfig {
  handler: () => false;
  path: string;
  validate: {
    request: {
      body?: zod.ZodTypeAny;
      params?: zod.ZodObject<zod.ZodRawShape>;
      query?: zod.ZodTypeAny;
    };
    responses: {
      [key: number]: {
        description: string;
        schema: zod.ZodTypeAny;
      };
    };
  };
}

export interface TRoutesManagerPlugin {
  method: (Route: IRouteConfig) => null;
  type: 'handler';
}

@Container.injectable()
export class RoutesManager {
  private readonly _methods: ((route: IRouteConfig) => void)[];

  public constructor() {
    this._methods = [];
  }

  @Container.builder()
  protected async builder(): Promise<void> {}

  @Container.interceptor<TRoutesManagerPlugin>()
  protected async interceptor(options: TRoutesManagerPlugin): Promise<void> {
    if (options.type === 'handler') {
      this._methods.push(options.method);
    } else {
    }
  }
}
