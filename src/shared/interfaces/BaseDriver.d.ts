import type { TVoidResult } from 'shared';

export interface IBaseDriver {
  startDriver(): Promise<TVoidResult>;
  stopDriver(): Promise<TVoidResult>;
}
