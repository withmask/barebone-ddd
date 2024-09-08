import { Container } from 'components';
import { getCallerPath, NoHandlerForRPCCommandException, Result } from 'shared';

import type { IContainer } from 'components';
import type { TResult, TVoidResult } from 'shared';

export interface TImmediateEventOptions<Data> {
  data: Data;
}

type TValidEventOverrideMatchOperands = '$EQ';

export type TConditionalEventReturn =
  | TResult<{ conditions: { [key: string]: string } }>
  | TVoidResult;

export type TConditionalEventOptions<Data> =
  | {
      data: Data;
      type: 'extractConditions';
    }
  | {
      conditions: {
        [key: string]: string;
      };
      data: Data;
      type: 'handle';
      override(conditions: {
        [key: string]: { [K in TValidEventOverrideMatchOperands]: string };
      }): Promise<TVoidResult>;
    };

export type TEventReturn<Conditional extends boolean> = [Conditional] extends [
  true
]
  ? TConditionalEventReturn
  : TVoidResult;

/**
 * @class ApplicationEventManager
 * @description A class that manages events across multiple aggregates and to sync data across domains.
 * @note
 *  #### There exists two types of emitted events:
 * + **RPC calls:**
 *    * These events require that all listeners succeed, usually done before an operating.
 *      For example:
 *        "we should only create a user subscription only if the user can be successfully billed."
 *        + The "subscriptions" domain emits a creatingUserSubscription.
 *        + The "billing" domain should listen to this event. And fail if the said user cannot be billed.
 * + **Delayed events:**
 *  * These events do not require immediate success of all listeners.
 *  * Certain listeners can require the emitter to fail when they fail.
 *  * These events can be re-tried, and use exponential back-off.
 *  * These events can be executed multiple times.
 *  * For example, deleting a user implicates deleting their messages, which does not affect the system if it tries multiple times.
 *  * Certain delayed events should be able to abort previous failed events by matching their conditions.
 *  Such example is a confirmation email for a specific user, if previous attempts have failed by the event sender service for the same user, and the user requests a new confirmation email then it should override the previous event and abort it. The conditions for this case would be { user: 'user-id' }
 * The event manager should provide a feature for listeners to abort previous events of the same handler with custom condition expressions, for the sake of simplicity so far, only have an "$EQ" condition.
 *
 */
@Container.injectable()
export class ApplicationEventManager {
  private static _pending: {
    events: Map<
      new (...args: any[]) => any,
      { conditional: boolean; immediate: boolean; name: string }[]
    >;
    rpc: Map<
      new (...args: any[]) => any,
      { command: string; method: string }[]
    >;
  } = { events: new Map(), rpc: new Map() };

  private static _registry:
    | {
        pending: {
          [domain: string]: {
            domain: string;
            events: {
              conditional: boolean;
              immediate: boolean;
              name: string;
            }[];
            handler: new (...args: any[]) => any;
            rpc: { command: string; method: string }[];
          }[];
        };
        ready: false;
      }
    | {
        events: {
          [domain: string]: {
            [event: string]: (
              | {
                  conditional: true;
                  immediate: false;
                  method: (
                    event: TConditionalEventOptions<any>
                  ) => Promise<TEventReturn<true>>;
                }
              | {
                  conditional: false;
                  immediate: false;
                  method: (
                    event: TImmediateEventOptions<any>
                  ) => Promise<TEventReturn<false>>;
                }
              | {
                  conditional: false;
                  immediate: true;
                  method: (
                    event: TImmediateEventOptions<any>
                  ) => Promise<TEventReturn<false>>;
                }
            )[];
          };
        };
        ready: true;
        rpc: {
          [domain: string]: {
            [command: string]: (data: any) => Promise<TResult<any>>;
          };
        };
      } = { ready: false, pending: {} };

  public constructor(
    @Container.injectContainer()
    private _container: IContainer
  ) {}

  public static async call<Req, Res>(
    command: string,
    data: Req
  ): Promise<TResult<Res>> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Emitting event before manager is ready');

    const domain = ApplicationEventManager._getEmitterDomain();

    if (!(domain in ApplicationEventManager._registry.rpc))
      return Result.fail(new NoHandlerForRPCCommandException(command, domain));

    if (!(command in ApplicationEventManager._registry.rpc[domain]))
      return Result.fail(new NoHandlerForRPCCommandException(command, domain));

    const result =
      await ApplicationEventManager._registry.rpc[domain][command](data);

    if (result.failed()) return result;

    const response = result.value();

    return Result.ok(response);
  }

  public static async emit<T>(event: string, data: T): Promise<TVoidResult> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Emitting event before manager is ready');

    const domain = ApplicationEventManager._getEmitterDomain();

    if (!(domain in ApplicationEventManager._registry.events))
      return Result.done();

    if (!(event in ApplicationEventManager._registry.events[domain]))
      return Result.done();

    for (const listener of ApplicationEventManager._registry.events[domain][
      event
    ]) {
      if (listener.immediate) {
        const eventResult = await listener.method({ data });

        if (eventResult.failed()) return eventResult;
      } else {
        if (listener.conditional) {
          const result = await listener.method({
            type: 'extractConditions',
            data
          });

          if (result.failed()) return result;
        } else {
          /**
           * @placeholder
           * @todo Save event for later executions
           */
        }

        /**
         * @todo Save event and propagate it to listeners
         * @todo If event was conditional save event data
         * @todo If event was not conditional do not save event data
         * @todo Immediately try running the event but do not crash the system if it fails
         */
      }
    }

    return Result.done();
  }

  public static event<I extends boolean, C extends boolean = false>(
    options: {
      immediate: I;
    } & ([I] extends [false] ? { conditional: C } : { [key: string]: never })
  ): <
    T extends (
      args: [C] extends [true]
        ? TConditionalEventOptions<any>
        : TImmediateEventOptions<any>
    ) => Promise<TEventReturn<C>>
  >(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) => TypedPropertyDescriptor<T> | void {
    return (target: any, property) => {
      const registeredEvents =
        ApplicationEventManager._pending.events.get(target.constructor) || [];

      registeredEvents.push({
        name: property as string,
        conditional: options.conditional || false,
        immediate: options.immediate
      });

      ApplicationEventManager._pending.events.set(
        target.constructor,
        registeredEvents
      );
    };
  }

  public static listener(domain: string): ClassDecorator {
    return (target: any) => {
      const listener = ApplicationEventManager._getEmitterDomain();

      const events = ApplicationEventManager._pending.events.get(target) || [],
        rpc = ApplicationEventManager._pending.rpc.get(target) || [];

      if (events.length === 0 && rpc.length === 0)
        throw new Error(
          `Class ${target.name} has no pending events nor rpc commands.`
        );

      if (ApplicationEventManager._registry.ready)
        throw new Error(
          'Installing an event listener when the event manager was already booted.'
        );

      if (!(domain in ApplicationEventManager._registry.pending))
        ApplicationEventManager._registry.pending[domain] = [];

      ApplicationEventManager._registry.pending[domain].push({
        handler: target,
        events: events,
        rpc: rpc,
        domain: listener
      });

      ApplicationEventManager._pending.events.delete(target);
      ApplicationEventManager._pending.rpc.delete(target);
    };
  }

  public static rpc<Req, Res>(
    command?: string
  ): <T extends (request: Req) => Promise<TResult<Res>>>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) => TypedPropertyDescriptor<T> | void {
    return function (target: any, property) {
      const registerRPC =
        ApplicationEventManager._pending.rpc.get(target.constructor) || [];

      registerRPC.push({
        command: command || (property as string),
        method: property as string
      });
    };
  }

  private static _getEmitterDomain(): string {
    return getCallerPath()!.match(/src\/app\/([^/]+)\//)![1];
  }

  @Container.builder()
  protected async prepare(): Promise<void> {
    const newRegistry: {
      events: {
        [domain: string]: {
          [event: string]: (
            | {
                conditional: true;
                immediate: false;
                method: (
                  event: TConditionalEventOptions<any>
                ) => Promise<TEventReturn<true>>;
              }
            | {
                conditional: false;
                immediate: false;
                method: (
                  event: TImmediateEventOptions<any>
                ) => Promise<TEventReturn<false>>;
              }
            | {
                conditional: false;
                immediate: true;
                method: (
                  event: TImmediateEventOptions<any>
                ) => Promise<TEventReturn<false>>;
              }
          )[];
        };
      };
      ready: true;
      rpc: {
        [domain: string]: {
          [command: string]: (data: any) => Promise<TResult<any>>;
        };
      };
    } = { ready: true, events: {}, rpc: {} };

    if (ApplicationEventManager._registry.ready)
      throw new Error('Building event manager when it was already booted.');

    for (const domain in ApplicationEventManager._registry) {
      if (
        Object.prototype.hasOwnProperty.call(
          ApplicationEventManager._registry,
          domain
        )
      ) {
        const registered = ApplicationEventManager._registry.pending[domain];

        if (!(domain in newRegistry.events)) newRegistry.events[domain] = {};

        for (const element of registered) {
          const built = await this._container.build(element.handler);

          for (const event of element.events) {
            if (
              !(event.name in ApplicationEventManager._registry.pending[domain])
            )
              newRegistry.events[domain][event.name] = [];

            newRegistry.events[domain][event.name].push({
              method: built[event.name].bind(built),
              conditional: event.conditional as false,
              immediate: event.immediate as true
            });
          }

          for (const rpc of element.rpc) {
            if (!(domain in newRegistry.rpc)) newRegistry.rpc[domain] = {};

            if (rpc.command in newRegistry.rpc[domain])
              throw new Error(
                `RPC command "${rpc}" for domain "${domain}" is already handled.`
              );

            newRegistry.rpc[domain][rpc.command] =
              built[rpc.method].bind(built);
          }
        }
      }
    }

    ApplicationEventManager._registry = newRegistry;

    ApplicationEventManager._pending.events.clear();
    ApplicationEventManager._pending.rpc.clear();
  }
}
