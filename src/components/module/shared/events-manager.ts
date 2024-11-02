import { eventsManagerTokens, Module } from 'components';
import {
  MongoEventFailureHistoryRepository,
  MongoEventHandlerRepository,
  MongoEventRepository
} from 'drivers/mongo';
import type {
  IEventFailureHistoryRepository,
  IEventHandlerRepository,
  IEventRepository
} from 'shared';

export const eventsManagerModule = Module.create();

eventsManagerModule.listen((bind) => {
  bind(eventsManagerTokens.repositories.events).to<IEventRepository>(
    MongoEventRepository
  );
  bind(
    eventsManagerTokens.repositories.eventsFailure
  ).to<IEventFailureHistoryRepository>(MongoEventFailureHistoryRepository);
  bind(
    eventsManagerTokens.repositories.eventsHandlers
  ).to<IEventHandlerRepository>(MongoEventHandlerRepository);
});
