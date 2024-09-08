/* eslint-disable max-classes-per-file */
import type { Module, PrivateClass } from 'components';

export type ContainerListener = (load: (source: Module) => void) => void;

export class Container {
  private static readonly _automatic: Set<new (...args: any[]) => any> =
    new Set();

  private static readonly _builderFunctions: Map<
    new (...args: any[]) => any,
    string | symbol
  > = new Map();

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

  private readonly _cache: { [key: string]: any };
  private _listener: ContainerListener | null;

  private _ready: boolean;

  private readonly _registry: {
    [key: string]: { cached: boolean; component: new (...args: any[]) => any };
  };

  private constructor() {
    this._ready = false;
    this._listener = null;
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
      if (Container._builderFunctions.has(target.constructor))
        throw new Error('A class cannot have multiple builder functions.');

      this._builderFunctions.set(target.constructor, prop);
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

  public async build<T>(element: new (...args: any[]) => T): Promise<T> {
    const registry: (string | (typeof Container)['_injectContainer'])[] =
        Container._dependencyRegistry.get(element) || [],
      args: any[] = [];

    for (const componentDependency of registry) {
      if (typeof componentDependency === 'symbol') {
        if (componentDependency === Container._injectContainer) args.push(this);
      } else
        args.push(await this._get(componentDependency, Object.create(null)));
    }

    if (args.length !== element.length)
      throw new Error(
        `Component ${element.name} takes ${element.length} dependencies but only ${args.length} were passed.`
      );

    const built = new element(...args);

    const builderMethod = Container._builderFunctions.get(element);

    if (typeof builderMethod === 'string') {
      await (built as any)[builderMethod].call(built);

      Container._builderFunctions.delete(element);
    }

    Container._dependencyRegistry.delete(element);

    return built;
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
  }

  private async _get(
    component: string,
    parents: { [key: string]: 0 }
  ): Promise<any> {
    if (component in this._cache) return this._cache[component];

    if (!(component in this._registry))
      throw new Error(`Cannot find component with id: ${component}`);

    const element = this._registry[component],
      registry: (string | (typeof Container)['_injectContainer'])[] =
        Container._dependencyRegistry.get(element.component) || [],
      args: any[] = [];

    for (const componentDependency of registry) {
      if (componentDependency === component)
        throw new Error('Circular self-dependency.');

      if (componentDependency in parents)
        throw new Error('Circular dependency.');

      if (typeof componentDependency === 'symbol') {
        if (componentDependency === Container._injectContainer) args.push(this);
      } else
        args.push(
          await this._get(componentDependency, { ...parents, [component]: 0 })
        );
    }

    if (args.length !== element.component.length)
      throw new Error(
        `Component ${component} takes ${element.component.length} dependencies but only ${args.length} were passed.`
      );

    const built = new element.component(...args);

    this._cache[component] = built;

    delete this._registry[component];

    Container._dependencyRegistry.delete(element.component);

    const builderMethod = Container._builderFunctions.get(element.component);

    if (typeof builderMethod === 'string') {
      await built[builderMethod].call(built);

      Container._builderFunctions.delete(element.component);
    }

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

        const element = Container._injectableRegistry.get(component);

        if (element === undefined)
          throw new Error(
            'A module seems to have bound a non-injectable class.'
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
    for (const componentID in this._registry) {
      if (Object.prototype.hasOwnProperty.call(this._registry, componentID)) {
        const component = this._registry[componentID];

        if (component.cached) await this.get(componentID);
      }
    }

    for (const automatic of Container._automatic) {
      await this.build(automatic);
    }

    Container._automatic.clear();
  }
}
