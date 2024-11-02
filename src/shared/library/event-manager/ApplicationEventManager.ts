import util from 'util';
import { Container, eventsManagerTokens, pluginsTokens } from 'components';

import {
  getApplicationCaller,
  NoHandlerForRPCCommandException,
  NoHandlerFoundException,
  Result
} from 'shared';

import type {
  CryptoPlugin,
  IEvent,
  IEventFailureHistoryRepository,
  IEventHandler,
  IEventHandlerRepository,
  IEventRepository,
  TDeepPartial,
  TResult,
  TVoidResult
} from 'shared';

export interface TEventOptions<Data> {
  data: Data;
  removeEvent<E>(
    name: string,
    match: TDeepPartial<E>,
    eventDomain?: string
  ): Promise<TVoidResult>;
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
          [domain: string]: {
            domain: string;
            events: {
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
            [event: string]: {
              domain: string;
              immediate: boolean;
              listener: string;
              method: (event: TEventOptions<any>) => Promise<TVoidResult>;
            }[];
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

    const { domain } = getApplicationCaller();

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

    const { domain } = getApplicationCaller();

    if (!(domain in ApplicationEventManager._registry.events))
      return Result.done();

    if (!(event in ApplicationEventManager._registry.events[domain]))
      return Result.done();

    const generateIDResult =
      await ApplicationEventManager.instance._cryptoPlugin.generateRandomUUID();

    if (generateIDResult.failed()) return generateIDResult;

    let eventNeededToBeStored = false;

    for (const listener of ApplicationEventManager._registry.events[domain][
      event
    ]) {
      if (listener.immediate) {
        const eventResult = await listener.method({
          data,
          removeEvent: ApplicationEventManager._createEventRemove(domain)
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
                domain: listener.domain,
                type: 'domain',
                listener: listener.listener
              },
              state: {
                acquiredAt: null,
                failures: 0,
                lockedAt: null
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
            domain,
            event,
            type: 'domain'
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

  public static async handleNextEvent(): Promise<TVoidResult> {
    const eventHandlerResult =
      await ApplicationEventManager.instance._eventHandlerRepository.getNextEventHandler();

    if (eventHandlerResult.failed()) return eventHandlerResult;

    const eventHandler = eventHandlerResult.value();

    if (eventHandler === null) {
      // console.log('No events to handle.');
      return Result.done();
    }

    const eventResult =
      await ApplicationEventManager.instance._eventRepository.getByID(
        eventHandler.event
      );

    if (eventResult.failed()) return eventResult;

    const event = eventResult.value();

    if (event === null) {
      console.log(`Can't find event: ${eventHandler.event}`);
      const deleteEventHandlerResult =
        await ApplicationEventManager.instance._eventHandlerRepository.deleteByEvents(
          [eventHandler.event]
        );

      if (deleteEventHandlerResult.failed()) return deleteEventHandlerResult;

      return Result.done();
    }

    try {
      const handleEventResult =
        await ApplicationEventManager._handleDelayedEvent(event, eventHandler);

      if (handleEventResult.failed()) {
        const exception = handleEventResult.error();
        const addEventFailureHistoryResult =
          await ApplicationEventManager.instance._eventFailureHistoryRepository.saveFailure(
            {
              event,
              failure: {
                data: {
                  type: 'EXCEPTION',
                  exception: {
                    kind: exception.kind,
                    name: exception.name,
                    details: {}
                  }
                },
                date: Date.now()
              },
              handler: eventHandler.listener,
              state: {
                attempts: eventHandler.state.failures
              }
            }
          );

        if (addEventFailureHistoryResult.failed())
          return addEventFailureHistoryResult;

        const updateEventHandlerResult =
          await ApplicationEventManager.instance._eventHandlerRepository.updateEventHandler(
            eventHandler.id,
            {
              state: {
                acquiredAt: null,
                failures: eventHandler.state.failures + 1,
                lockedAt: Date.now()
              }
            }
          );

        if (updateEventHandlerResult.failed()) return updateEventHandlerResult;
      }
    } catch (error) {
      const addEventFailureHistoryResult =
        await ApplicationEventManager.instance._eventFailureHistoryRepository.saveFailure(
          {
            event,
            failure: {
              data: {
                type: 'THROW',
                error: util.inspect(error)
              },
              date: Date.now()
            },
            handler: eventHandler.listener,
            state: {
              attempts: eventHandler.state.failures
            }
          }
        );

      if (addEventFailureHistoryResult.failed())
        return addEventFailureHistoryResult;

      const updateEventHandlerResult =
        await ApplicationEventManager.instance._eventHandlerRepository.updateEventHandler(
          eventHandler.id,
          {
            state: {
              acquiredAt: null,
              failures: eventHandler.state.failures + 1,
              lockedAt: Date.now()
            }
          }
        );

      if (updateEventHandlerResult.failed()) return updateEventHandlerResult;
    }

    return Result.done();
  }

  public static listener(domain: string): ClassDecorator {
    return (target: any) => {
      const { domain: listener } = getApplicationCaller();

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

  private static _createEventRemove(
    defaultDomain: string
  ): <E>(
    name: string,
    match: TDeepPartial<E>,
    eventDomain?: string
  ) => Promise<TVoidResult> {
    return async function <E>(
      name: string,
      match: TDeepPartial<E>,
      eventDomain: string = defaultDomain
    ): Promise<TVoidResult> {
      const deleteEventResult =
        await ApplicationEventManager.instance._eventRepository.deleteEvent({
          emitter: {
            domain: eventDomain,
            event: name,
            type: 'domain'
          },
          data: match
        });

      if (deleteEventResult.failed()) return deleteEventResult;

      const deleteEventHandlersResult =
        await ApplicationEventManager.instance._eventHandlerRepository.deleteByEvents(
          deleteEventResult.value()
        );

      if (deleteEventHandlersResult.failed()) return deleteEventHandlersResult;

      return Result.done();
    };
  }

  private static async _handleDelayedEvent(
    event: IEvent<any>,
    eventHandler: IEventHandler
  ): Promise<TVoidResult> {
    if (!ApplicationEventManager._registry.ready)
      throw new Error('Handling event before manager is ready');

    const handler = ApplicationEventManager._registry.events[
      event.emitter.domain
    ][event.emitter.event].find(
      (v) =>
        v.domain === eventHandler.listener.domain &&
        v.listener === eventHandler.listener.listener
    );

    if (!handler)
      return Result.fail(
        new NoHandlerFoundException({
          type: 'domain',
          listener: eventHandler.listener.listener,
          method: event.emitter.event
        })
      );

    const handlerResult = await handler.method({
      data: event.data,
      removeEvent: ApplicationEventManager._createEventRemove(
        event.emitter.domain
      )
    });

    if (handlerResult.failed()) return handlerResult;

    const deleteEventHandlerResult =
      await ApplicationEventManager.instance._eventHandlerRepository.deleteEventHandler(
        eventHandler.id
      );

    if (deleteEventHandlerResult.failed()) return deleteEventHandlerResult;

    return Result.done();
  }

  @Container.builder()
  protected async prepare(): Promise<void> {
    const newRegistry: {
      events: {
        [domain: string]: {
          [event: string]: {
            domain: string;
            immediate: boolean;
            listener: string;
            method: (event: TEventOptions<any>) => Promise<TVoidResult>;
          }[];
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

    for (const domain in ApplicationEventManager._registry.pending) {
      if (
        Object.prototype.hasOwnProperty.call(
          ApplicationEventManager._registry.pending,
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
              domain: element.domain,
              method: built[event.name].bind(built),
              immediate: event.immediate as true,
              listener: element.handler.name
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
    ApplicationEventManager.__instance = this;
  }
}
