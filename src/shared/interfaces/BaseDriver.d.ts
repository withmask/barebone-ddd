export interface IDriver {
  startDriver(): Promise<void>;
  stopDriver(): Promise<void>;
}
