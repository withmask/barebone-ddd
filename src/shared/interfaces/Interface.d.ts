import type { TVoidResult } from 'shared';

export interface IInterface {
  boot?(): Promise<TVoidResult>;

  main(): Promise<TVoidResult>;
}
