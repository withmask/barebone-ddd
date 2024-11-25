import util from 'util';
import {
  Container,
  eventsManagerTokens,
  libraryTokens,
  pluginsTokens
} from 'components';

import {
  Exception,
  getApplicationCaller,
  NoHandlerForRPCCommandException,
  NoHandlerFoundException,
  Result
} from 'shared';

import type {
  CryptoPlugin,
  IEvent,
  IEventFailureHistory,
  IEventFailureHistoryRepository,
  IEventHandler,
  IEventHandlerRepository,
  IEventRepository,
  PeriodicManagerPluginData,
  TDeepPartial,
  TResult,
  TVoidResult
} from 'shared';

export interface TEventOptions<Data> {
  data: Data;
  removeEvent<E>(
    name: string,
    match: TDeepPartial<E>,
    eventDomain?: { name: string; type: 'domain' | 'service' }
  ): Promise<TVoidResult>;
}

export interface TGetNextEvent<E> {
  addFailure(
    event: IEvent<E>,
    handler: IEventHandler<'external'>,
    failure: IEventFailureHistory['failure']['data']
  ): Promise<TVoidResult>;
  finish(handler: IEventHandler<'external'>): Promise<TVoidResult>;
  next(): Promise<
    | TResult<{ event: IEvent<E>; handler: IEventHandler<'external'> }>
    | TVoidResult
  >;
}

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
@Container.auto()
export class ApplicationEventManager {
  private static __instance: ApplicationEventManager | null = null;

  private static _pending: {
    events: Map<
      new (...args: any[]) => any,
      { immediate: boolean; name: string }[]
    >;
    rpc: Map<
      new (...args: any[]) => any,
      { command: string; method: string }[]
    >;
  } = { events: new Map(), rpc: new Map() };

  private static _registry:
    | {
        pending: {
          [K in 'domains']: {
            [domain: string]: {
              events: {
                immediate: boolean;
                name: string;
                type: 'internal' | 'external';
              }[];

              handler: null | (new (...args: any[]) => any);
              listener: string;

              name: string;

              rpc: { command: string; method: string }[];

              type: 'domain' | 'service' | 'interface';
            }[];
          };
        };
        ready: false;
      }
    | {
        events: {
          [K in 'domains']: {
            [emitter: string]: {
              [event: string]: {
                immediate: boolean;
                listener: string;
                method:
                  | null
                  | ((event: TEventOptions<any>) => Promise<TVoidResult>);
                name: string;
                type: 'domain' | 'service' | 'interface';
              }[];
            };
          };
        };
        ready: true;
        rpc: {
          [domain: string]: {
            [command: string]: (data: any) => Promise<TResult<any>>;
          };
        };
      } = {
    ready: false,
    pending: {
      domains: {}
    }
  };

  public constructor(
    @Container.injectContainer()
    private readonly _container: Container,
    @Container.inject(eventsManagerTokens.repositories.events)
    private readonly _eventRepository: IEventRepository,
    @Container.inject(eventsManagerTokens.repositories.eventsHandlers)
    private readonly _eventHandlerRepository: IEventHandlerRepository,
    @Container.inject(eventsManagerTokens.repositories.eventsFailure)
    private readonly _eventFailureHistoryRepository: IEventFailureHistoryRepository,
    @Container.inject(pluginsTokens.cryptoPlugin)
    private readonly _cryptoPlugin: CryptoPlugin
  ) {}

  private static get instance(): ApplicationEventManager {
    if (ApplicationEventManager.__instance)
      return ApplicationEventManager.__instance;

    throw new Error('Application Event Manager instance not initiated.');
  }

  public static async call<Req, Res>(
    command: string,
    data: Req
  ): Promise<TResult<Res>> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Emitting event before manager is ready');

    const listener = getApplicationCaller();

    if (listener.type !== 'domain')
      throw new Error(
        `Only domains can perform RPC calls. Caller "${listener.name}" of type "${listener.type}" tried calling "${command}"`
      );

    if (!(listener.name in ApplicationEventManager._registry.rpc))
      return Result.fail(
        new NoHandlerForRPCCommandException(command, listener.name)
      );

    if (!(command in ApplicationEventManager._registry.rpc[listener.name]))
      return Result.fail(
        new NoHandlerForRPCCommandException(command, listener.name)
      );

    const result =
      await ApplicationEventManager._registry.rpc[listener.name][command](data);

    if (result.failed()) return result;

    const response = result.value();

    return Result.ok(response);
  }

  public static async emit<T>(event: string, data: T): Promise<TVoidResult> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Emitting event before manager is ready');

    const emitter = getApplicationCaller();

    if (emitter.type !== 'domain')
      throw new Error(
        `Only domains can emit events. Component ${emitter.name} of type ${emitter.type} tried emitting ${event}`
      );

    if (!(emitter.name in ApplicationEventManager._registry.events.domains))
      return Result.done();

    if (
      !(event in ApplicationEventManager._registry.events.domains[emitter.name])
    )
      return Result.done();

    const generateIDResult =
      await ApplicationEventManager.instance._cryptoPlugin.generateRandomUUID();

    if (generateIDResult.failed()) return generateIDResult;

    let eventNeededToBeStored = false;

    for (const listener of ApplicationEventManager._registry.events.domains[
      emitter.name
    ][event]) {
      if (listener.immediate) {
        const eventResult = await listener.method!({
          data,
          removeEvent: ApplicationEventManager._createEventRemove({
            name: event,
            type: emitter.type
          })
        });

        if (eventResult.failed()) return eventResult;
      } else {
        eventNeededToBeStored = true;

        const generateHandlerIDResult =
          await ApplicationEventManager.instance._cryptoPlugin.generateRandomUUID();

        if (generateHandlerIDResult.failed()) return generateHandlerIDResult;

        const addEventHandlerResult =
          await ApplicationEventManager.instance._eventHandlerRepository.addEventHandler(
            {
              id: generateHandlerIDResult.value(),
              createdAt: Date.now(),
              event: generateIDResult.value(),
              listener: {
                name: listener.name,
                type: listener.type,
                listener: listener.listener
              },
              state: {
                acquiredAt: null,
                failures: 0,
                lockedAt: null,
                type: listener.method === null ? 'external' : 'local'
              }
            }
          );

        if (addEventHandlerResult.failed()) return addEventHandlerResult;
      }
    }

    if (eventNeededToBeStored) {
      const storeEventResult =
        await ApplicationEventManager.instance._eventRepository.storeEvent({
          data,
          emittedAt: Date.now(),
          emitter: {
            name: emitter.name,
            event,
            type: emitter.type
          },
          id: generateIDResult.value()
        });

      if (storeEventResult.failed()) return storeEventResult;
    }

    return Result.done();
  }

  public static event<I extends boolean>(options: {
    immediate: I;
  }): <T extends (args: TEventOptions<any>) => Promise<TVoidResult>>(
    target: object,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<T>
  ) => TypedPropertyDescriptor<T> | void {
    return (target: any, property) => {
      const registeredEvents =
        ApplicationEventManager._pending.events.get(target.constructor) || [];

      registeredEvents.push({
        name: property as string,
        immediate: options.immediate
      });

      ApplicationEventManager._pending.events.set(
        target.constructor,
        registeredEvents
      );
    };
  }

  public static externalListener<I>(events: {
    [domain: string]: string[];
  }): ClassDecorator {
    return (target) => {
      console.log(target, events);
      if (ApplicationEventManager._registry.ready)
        throw new Error(
          'Installing an external event listener when the event manager was already booted.'
        );

      const listener = getApplicationCaller();

      for (const domain in events) {
        if (Object.prototype.hasOwnProperty.call(events, domain)) {
          const listenEvents = events[domain];
          if (!(domain in ApplicationEventManager._registry.pending.domains))
            ApplicationEventManager._registry.pending.domains[domain] = [];

          ApplicationEventManager._registry.pending.domains[domain].push({
            handler: null,
            events: listenEvents.map((v) => ({
              type: 'external',
              name: v,
              immediate: false
            })),
            listener: target.name,
            rpc: [],
            name: listener.name,
            type: listener.type
          });
        }
      }

      const getNext: TGetNextEvent<I> = {
        async next() {
          while (true) {
            const eventHandlerResult =
              await ApplicationEventManager.instance._eventHandlerRepository.getNextEventHandler(
                'external',
                {
                  listener: target.name,
                  name: listener.name,
                  type: listener.type
                }
              );

            if (eventHandlerResult.failed()) return eventHandlerResult;

            const eventHandler = eventHandlerResult.value();

            if (eventHandler === null) return Result.done();

            const eventResult =
              await ApplicationEventManager.instance._eventRepository.getByID(
                eventHandler.event
              );

            if (eventResult.failed()) return eventResult;

            const event = eventResult.value();

            console.debug({ event });

            if (event === null) {
              const deleteEventHandlerResult =
                await ApplicationEventManager.instance._eventHandlerRepository.deleteByEvents(
                  [eventHandler.event]
                );

              if (deleteEventHandlerResult.failed())
                return deleteEventHandlerResult;
            } else
              return Result.ok({
                event,
                handler: eventHandler
              });
          }
        },
        async addFailure(event, handler, failure) {
          const addEventFailureHistoryResult =
            await ApplicationEventManager.instance._eventFailureHistoryRepository.saveFailure(
              {
                event,
                failure: {
                  data: failure,
                  date: Date.now()
                },
                handler: handler.listener,
                state: {
                  attempts: handler.state.failures
                }
              }
            );

          if (addEventFailureHistoryResult.failed())
            return addEventFailureHistoryResult;

          const updateEventHandlerResult =
            await ApplicationEventManager.instance._eventHandlerRepository.updateEventHandler(
              handler.id,
              {
                state: {
                  acquiredAt: null,
                  failures: handler.state.failures + 1,
                  lockedAt: Date.now()
                }
              }
            );

          if (updateEventHandlerResult.failed())
            return updateEventHandlerResult;

          return Result.done();
        },
        async finish(handler) {
          const deleteEventHandlerResult =
            await ApplicationEventManager.instance._eventHandlerRepository.deleteEventHandler(
              handler.id
            );

          if (deleteEventHandlerResult.failed())
            return deleteEventHandlerResult;

          return Result.done();
        }
      };

      Object.defineProperty(target.prototype, '_eventEmitter', {
        writable: false,
        configurable: false,
        enumerable: false,
        value: getNext
      });
    };
  }

  public static listener(domain: string): ClassDecorator {
    return (target: any) => {
      const listener = getApplicationCaller();

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

      if (!(domain in ApplicationEventManager._registry.pending.domains))
        ApplicationEventManager._registry.pending.domains[domain] = [];

      ApplicationEventManager._registry.pending.domains[domain].push({
        handler: target,
        events: events.map((v) => ({ type: 'internal', ...v })),
        rpc: rpc,
        listener: target.name,
        name: listener.name,
        type: listener.type
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

  private static _createEventRemove(defaultEmitter: {
    name: string;
    type: 'domain';
  }): <E>(
    name: string,
    match: TDeepPartial<E>,
    eventDomain?: {
      name: string;
      type: 'domain';
    }
  ) => Promise<TVoidResult> {
    return async function <E>(
      name: string,
      match: TDeepPartial<E>,
      emitter: {
        name: string;
        type: 'domain';
      } = defaultEmitter
    ): Promise<TVoidResult> {
      const deleteEventResult =
        await ApplicationEventManager.instance._eventRepository.deleteEvent({
          emitter: {
            name: emitter.name,
            event: name,
            type: emitter.type
          },
          data: match
        });

      if (deleteEventResult.failed()) return deleteEventResult;

      return Result.done();
    };
  }

  @Container.plugin<PeriodicManagerPluginData>(libraryTokens.periodicManager, {
    operation: 'Handle delayed domain events.',
    sleep: null
  })
  protected async handleNextEvent(): Promise<TVoidResult> {
    const eventHandlerResult =
      await this._eventHandlerRepository.getNextEventHandler('local');

    if (eventHandlerResult.failed()) return eventHandlerResult;

    const eventHandler = eventHandlerResult.value();

    if (eventHandler === null) {
      return Result.done();
    }

    const eventResult = await this._eventRepository.getByID(eventHandler.event);

    if (eventResult.failed()) return eventResult;

    const event = eventResult.value();

    if (event === null) {
      const deleteEventHandlerResult =
        await this._eventHandlerRepository.deleteByEvents([eventHandler.event]);

      if (deleteEventHandlerResult.failed()) return deleteEventHandlerResult;

      return Result.done();
    }

    try {
      const handleEventResult = await this._handleDelayedEvent(
        event,
        eventHandler
      );

      if (handleEventResult.failed()) throw handleEventResult.error();
    } catch (error) {
      let failure: IEventFailureHistory['failure']['data'];

      if (error instanceof Exception) {
        failure = {
          type: 'EXCEPTION',
          exception: {
            kind: error.kind,
            name: error.name,
            details: error.toJSON()
          }
        };
      } else {
        failure = {
          type: 'THROW',
          error: util.inspect(error)
        };
      }

      const addEventFailureHistoryResult =
        await this._eventFailureHistoryRepository.saveFailure({
          event,
          failure: {
            data: failure,
            date: Date.now()
          },
          handler: eventHandler.listener,
          state: {
            attempts: eventHandler.state.failures
          }
        });

      if (addEventFailureHistoryResult.failed())
        return addEventFailureHistoryResult;

      const updateEventHandlerResult =
        await this._eventHandlerRepository.updateEventHandler(eventHandler.id, {
          state: {
            acquiredAt: null,
            failures: eventHandler.state.failures + 1,
            lockedAt: Date.now()
          }
        });

      if (updateEventHandlerResult.failed()) return updateEventHandlerResult;
    }

    return Result.done();
  }

  @Container.builder()
  protected async prepare(): Promise<void> {
    const newRegistry: Extract<
      (typeof ApplicationEventManager)['_registry'],
      { ready: true }
    > = {
      ready: true,
      events: {
        domains: {}
      },
      rpc: {}
    };

    if (ApplicationEventManager._registry.ready)
      throw new Error('Building event manager when it was already booted.');

    for (const name in ApplicationEventManager._registry.pending.domains) {
      if (
        Object.prototype.hasOwnProperty.call(
          ApplicationEventManager._registry.pending.domains,
          name
        )
      ) {
        const registered =
          ApplicationEventManager._registry.pending.domains[name];

        if (!(name in newRegistry.events.domains))
          newRegistry.events.domains[name] = {};

        for (const element of registered) {
          const built =
            element.handler === null
              ? null
              : await this._container.build(element.handler);

          for (const event of element.events) {
            if (!(event.name in newRegistry.events.domains[name]))
              newRegistry.events.domains[name][event.name] = [];

            newRegistry.events.domains[name][event.name].push({
              name: element.name,
              method: null === built ? null : built[event.name].bind(built),
              immediate: event.immediate,
              listener: element.listener,
              type: element.type
            });
          }

          for (const rpc of element.rpc) {
            if (!(name in newRegistry.rpc)) newRegistry.rpc[name] = {};

            if (rpc.command in newRegistry.rpc[name])
              throw new Error(
                `RPC command "${rpc}" for domain "${name}" is already handled.`
              );

            newRegistry.rpc[name][rpc.command] = built[rpc.method].bind(built);
          }
        }
      }
    }

    ApplicationEventManager._registry = newRegistry;

    ApplicationEventManager._pending.events.clear();
    ApplicationEventManager._pending.rpc.clear();
    ApplicationEventManager.__instance = this;
  }

  @Container.plugin<PeriodicManagerPluginData>(libraryTokens.periodicManager, {
    operation: `Purge events with no handlers`,
    sleep: 10 * 60 * 1000
  })
  protected async purgeFinishedEvents(): Promise<TVoidResult> {
    let ids: string[] = [];

    for await (const eventResult of this._eventRepository.all()) {
      if (eventResult.failed()) return eventResult;

      const event = eventResult.value();

      const countResult = await this._eventHandlerRepository.countByEvent(
        event.id
      );

      if (countResult.failed()) return countResult;

      const count = countResult.value();

      if (count === 0) ids.push(event.id);

      if (ids.length === 100) {
        const deleteManyResult = await this._eventRepository.deleteEvents(ids);

        if (deleteManyResult.failed()) return deleteManyResult;

        ids = [];
      }
    }

    if (ids.length) {
      const deleteManyResult = await this._eventRepository.deleteEvents(ids);

      if (deleteManyResult.failed()) return deleteManyResult;
    }

    return Result.done();
  }

  private async _handleDelayedEvent(
    event: IEvent<any>,
    eventHandler: IEventHandler
  ): Promise<TVoidResult> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Handling event before manager is ready');

    const handler = ApplicationEventManager._registry.events.domains[
      event.emitter.name
    ][event.emitter.event].find(
      (v) =>
        v.name === eventHandler.listener.name &&
        v.listener === eventHandler.listener.listener
    );

    if (!handler)
      return Result.fail(
        new NoHandlerFoundException({
          type: eventHandler.listener.type,
          listener: eventHandler.listener.listener,
          method: event.emitter.event
        })
      );

    const handlerResult = await handler.method!({
      data: event.data,
      removeEvent: ApplicationEventManager._createEventRemove({
        name: event.emitter.name,
        type: event.emitter.type
      })
    });

    if (handlerResult.failed()) return handlerResult;

    const deleteEventHandlerResult =
      await this._eventHandlerRepository.deleteEventHandler(eventHandler.id);

    if (deleteEventHandlerResult.failed()) return deleteEventHandlerResult;

    return Result.done();
  }
}
