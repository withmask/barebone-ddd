export interface IBaseDriver {
  startDriver(): Promise<void>;
  stopDriver(): Promise<void>;
}
