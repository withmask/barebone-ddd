import { Container } from 'components';
import type { PrivateClass } from 'components';

export interface Binding {
  to: <T>(value: new (...args: any[]) => T) => void;
  cached(): Binding;
}

export type ModuleListener = (bind: (identifier: string) => Binding) => void;

export class Module {
  private _listener: ModuleListener | null;
  private _ready: boolean;

  private _registry: {
    [key: string]: {
      cached: boolean;
      component: PrivateClass;
    };
  };

  private constructor() {
    this._ready = false;
    this._listener = null;
    this._registry = Object.create(null);
  }

  public static create(): Module {
    return new Module();
  }

  public listen(listener: ModuleListener): void {
    if (this._ready)
      throw new Error(
        'Tried to install module listener after it was already loaded.'
      );

    if (typeof this._listener === 'function')
      throw new Error('Tried to install two module listeners.');

    this._listener = listener;
  }

  protected __export(): {
    [key: string]: {
      cached: boolean;
      component: PrivateClass;
    };
  } {
    const copy = Object.assign(
      Object.create(null) as {
        [key: string]: { cached: boolean; component: PrivateClass };
      },
      this._registry
    );

    this._registry = Object.create(null);

    return copy;
  }

  protected __load(): void {
    if (this._ready)
      throw new Error('Tried to load module after it was already loaded.');

    if (typeof this._listener !== 'function')
      throw new Error('Tried to load module without listener installed.');

    this._listener(this._bind.bind(this));
    this._ready = true;
    this._listener = null;
  }

  private _bind(id: string): Binding {
    const registry = this._registry;

    if (id in registry)
      throw new Error(
        `Tried to bind a component that was already bound. ${id}`
      );

    let toCalled = false;
    let cached = false;

    const binding: Binding = {
      to<T>(component: new (...args: any[]) => T): void {
        if (!Container['_injectableRegistry'].has(component))
          throw new Error(
            `Tried to bind token (${id}) to a non-injectable class ${component.name}.`
          );

        if (toCalled)
          throw new Error(`Tried to bind token (${id}) multiple times.`);

        toCalled = true;

        registry[id] = { cached, component };
      },
      cached(): Binding {
        if (cached)
          throw new Error(
            `Tried to declare component (${id}) as cached multiple times.`
          );

        cached = true;

        return binding;
      }
    };

    return binding;
  }
}
