/* eslint-disable max-classes-per-file */
import type { TypedMethodDecorator } from 'shared';
import type { Module, PrivateClass } from 'components';

interface ContainerPluginMetadata {
  method: (...args: any[]) => any;
}

export type ContainerListener = (load: (source: Module) => void) => void;

export class Container {
  private static readonly _automatic: Set<new (...args: any[]) => any> =
    new Set();

  private static readonly _dependencyRegistry: Map<
    new (...args: any[]) => any,
    (string | (typeof Container)['_injectContainer'])[]
  > = new Map();

  private static readonly _injectContainer: unique symbol =
    Symbol('inject_container');

  private static readonly _injectableRegistry: Map<
    PrivateClass,
    new (...args: any[]) => any
  > = new Map();

  private static _instance: Container | null = null;

  private static readonly _pluginMetadata: Map<
    new (...args: any[]) => any,
    {
      [pluginToken: string]: {
        [property: string]: any;
      };
    }
  > = new Map();

  private static readonly _specialFunctions: Map<
    new (...args: any[]) => any,
    Map<'builder' | 'interceptor', string>
  > = new Map();

  private readonly _cache: { [key: string]: any };
  private _listener: ContainerListener | null;
  private readonly _plugins: {
    methods: {
      [component: string]: (options: {
        [key: string]: any;
        method: (...args: any[]) => any;
      }) => any;
    };
    queue: {
      methods: {
        [component: string]: {
          [key: string]: any;
          method: (...args: any[]) => any;
        }[];
      };
    };
  };

  private _ready: boolean;

  private readonly _registry: {
    [key: string]: { cached: boolean; component: new (...args: any[]) => any };
  };

  private constructor() {
    this._ready = false;
    this._listener = null;
    this._plugins = {
      methods: {},
      queue: {
        methods: {}
      }
    };
    this._cache = Object.create(null);
    this._registry = Object.create(null);
  }

  public static auto(): ClassDecorator {
    return <TFunction>(target: any) => {
      if (!this._automatic.has(target)) this._automatic.add(target);

      class InjectableGuard extends target {
        //@ts-expect-error The super call is not needed. The system crashes before initiating the sub class.
        private constructor() {
          throw new Error(
            'Cannot construct an injectable component. Use Container.prototype.get instead.'
          );
        }
      }

      return InjectableGuard as TFunction;
    };
  }

  public static builder(): MethodDecorator {
    return (target: any, prop: string | symbol) => {
      const specialFunctions =
        Container._specialFunctions.get(target.constructor) || new Map();

      if (specialFunctions.get('builder'))
        throw new Error('A class cannot have multiple builder functions.');

      specialFunctions.set('builder', prop);

      this._specialFunctions.set(target.constructor, specialFunctions);
    };
  }

  public static cached<T>(token: string): T {
    if (Container._instance === null)
      throw new Error(
        'Cannot fetch cached component before building the container.'
      );

    if (!(token in Container._instance._cache))
      throw new Error(`No component with id '${token}' is cached.`);

    return Container._instance._cache[token];
  }

  public static create(): Container {
    if (Container._instance !== null)
      throw new Error('Container class can only be constructed once.');

    Container._instance = new Container();

    return Container._instance;
  }

  public static inject(id: string): ParameterDecorator {
    return (target: any, prop, index) => {
      if (typeof prop !== 'undefined')
        throw new Error(
          'Parameter decorator can only be used with constructors'
        );

      if (!this._dependencyRegistry.has(target))
        this._dependencyRegistry.set(target, []);

      this._dependencyRegistry.get(target)![index] = id;
    };
  }

  public static injectContainer(): ParameterDecorator {
    return (target: any, prop, index) => {
      if (typeof prop !== 'undefined')
        throw new Error(
          'Parameter decorator can only be used with constructors'
        );

      if (!this._dependencyRegistry.has(target))
        this._dependencyRegistry.set(target, []);

      this._dependencyRegistry.get(target)![index] = Container._injectContainer;
    };
  }

  public static injectable(): ClassDecorator {
    return function <TFunction>(target: any) {
      class InjectableGuard extends target {
        //@ts-expect-error The super call is not needed. The system crashes before initiating the sub class.
        private constructor() {
          throw new Error(
            'Cannot construct an injectable component. Use Container.prototype.get instead.'
          );
        }
      }

      Container._injectableRegistry.set(InjectableGuard, target);

      return InjectableGuard as TFunction;
    };
  }

  public static interceptor<
    M extends ContainerPluginMetadata
  >(): TypedMethodDecorator<(options: M) => void> {
    return (target: any, prop: string | symbol) => {
      const specialFunctions =
        Container._specialFunctions.get(target.constructor) || new Map();

      if (specialFunctions.get('interceptor'))
        throw new Error('A class cannot have multiple builder functions.');

      specialFunctions.set('interceptor', prop);

      this._specialFunctions.set(target.constructor, specialFunctions);
    };
  }

  public static plugin<M extends ContainerPluginMetadata>(
    token: string,
    ...[data]: [Omit<M, 'method'>] extends [never]
      ? []
      : [data: Omit<M, 'method'>]
  ): TypedMethodDecorator<M['method']> {
    return (target: any, prop) => {
      const pluginMetadata = this._pluginMetadata.get(target.constructor) || {};

      if (!(token in pluginMetadata)) pluginMetadata[token] = {};
      pluginMetadata[token][prop as string] = data;

      this._pluginMetadata.set(target.constructor, pluginMetadata);
    };
  }

  public build<T>(element: new (...args: any[]) => T): Promise<T> {
    return this._build(element);
  }

  public async get<T>(component: string): Promise<T> {
    if (!this._ready)
      throw new Error('Tried to get components before Container is ready.');

    return await this._get(component, Object.create(null));
  }

  public listen(listener: ContainerListener): void {
    if (this._ready)
      throw new Error(
        'Tried to install container listener after it was already loaded.'
      );

    if (typeof this._listener === 'function')
      throw new Error('Tried to install two container listeners.');

    this._listener = listener;
  }

  public async load(): Promise<void> {
    if (this._ready)
      throw new Error('Tried to load container after it was already loaded.');

    if (typeof this._listener !== 'function')
      throw new Error('Tried to load container without listener installed.');

    this._listener(this._load.bind(this));
    this._listener = null;

    await this._prepare();

    this._ready = true;

    for (const componentID in this._registry) {
      if (Object.prototype.hasOwnProperty.call(this._registry, componentID)) {
        const component = this._registry[componentID];

        if (component.cached) await this.get(componentID);
      }
    }
  }

  private async _build(
    element: new (...args: any) => any,
    parents: { [key: string]: 0 } = {},
    component?: string
  ): Promise<any> {
    const registry: (string | (typeof Container)['_injectContainer'])[] =
        Container._dependencyRegistry.get(element) || [],
      id = component || element.name,
      args: any[] = [];

    for (const componentDependency of registry) {
      if (componentDependency === id)
        throw new Error('Circular self-dependency.');

      if (componentDependency in parents)
        throw new Error('Circular dependency.');

      if (typeof componentDependency === 'symbol') {
        if (componentDependency === Container._injectContainer) args.push(this);
      } else
        args.push(
          await this._get(componentDependency, {
            ...parents,
            [id]: 0
          })
        );
    }

    if (args.length !== element.length)
      throw new Error(
        `Component ${id} takes ${element.length} dependencies but only ${args.length} were passed.`
      );

    const built = new element(...args);

    Container._dependencyRegistry.delete(element);

    const specialMethods = Container._specialFunctions.get(element);
    const builderMethod = specialMethods?.get('builder');
    const interceptorMethod = specialMethods?.get('interceptor');
    if (typeof builderMethod === 'string')
      await (built as any)[builderMethod].call(built);

    if (typeof interceptorMethod === 'string') {
      if (component === undefined)
        throw new Error(
          `Manually built component ${id} cannot have interceptor method ${interceptorMethod}.`
        );

      this._plugins.methods[id] = (built as any)[interceptorMethod].bind(built);

      if (id in this._plugins.queue.methods) {
        for (const pending of this._plugins.queue.methods[id]) {
          this._plugins.methods[id](pending);
        }
        delete this._plugins.queue.methods[id];
      }
    }

    Container._specialFunctions.delete(element);

    const pluginMetadataRegistry = Container._pluginMetadata.get(element);

    if (pluginMetadataRegistry) {
      for (const plugin of Object.keys(pluginMetadataRegistry)) {
        const propertiesWithMetadata = pluginMetadataRegistry[plugin];

        for (const prop of Object.keys(propertiesWithMetadata)) {
          const metadata = propertiesWithMetadata[prop];

          if (plugin in this._plugins.methods)
            this._plugins.methods[plugin]({ method: built[prop].bind(built) });
          else {
            if (!(plugin in this._plugins.queue.methods))
              this._plugins.queue.methods[plugin] = [];

            this._plugins.queue.methods[plugin].push({
              ...metadata,
              method: built[prop].bind(built)
            });
          }
        }
      }
    }

    return built;
  }

  private async _get(
    component: string,
    parents: { [key: string]: 0 }
  ): Promise<any> {
    if (component in this._cache) return this._cache[component];

    if (!(component in this._registry))
      throw new Error(`Cannot find component with id: ${component}`);

    const element = this._registry[component];

    const built = await this._build(element.component, parents, component);

    this._cache[component] = built;

    delete this._registry[component];

    return built;
  }

  private _load(module: Module): void {
    module['__load']();

    const exported = module['__export']();

    for (const identifier in exported) {
      if (Object.prototype.hasOwnProperty.call(exported, identifier)) {
        const component = exported[identifier];

        if (identifier in this._registry)
          throw new Error(
            'Tried to bind a component that was already bound. Modules or Sources may have conflicting tokens or modules.'
          );

        const element = Container._injectableRegistry.get(component.component);

        if (element === undefined)
          throw new Error(
            `A module seems to have bound a non-injectable class: ${component.component.constructor.name}.`
          );

        Container._injectableRegistry.delete(component);

        this._registry[identifier] = {
          component: element,
          cached: component.cached
        };
      }
    }
  }

  private async _prepare(): Promise<void> {
    for (const automatic of Container._automatic) {
      await this.build(automatic);
    }

    Container._automatic.clear();
  }
}
