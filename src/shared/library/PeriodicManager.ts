import { Container } from 'components';
import type { TVoidResult } from 'shared';

export interface PeriodicManagerPluginData {
  method: () => Promise<TVoidResult>;
  operation: string;
  sleep: number | null;
}

@Container.injectable()
export class PeriodicManager {
  private _failed: boolean;
  private readonly _registry: PeriodicManagerPluginData[];
  private _running: number = 0;

  public constructor() {
    this._registry = [];
    this._failed = false;
  }

  @Container.interceptor<PeriodicManagerPluginData>()
  protected async interceptor(
    options: PeriodicManagerPluginData
  ): Promise<void> {
    this._registry.push(options);
  }

  public hasFailed(): boolean {
    return this._running === 0 && this._failed;
  }

  public startJobs(): void {
    for (const job of this._registry) {
      void this._handleJob(job.sleep, job.operation, job.method);
    }
  }

  private async _handleJob(
    sleep: number | null,
    description: string,
    method: () => Promise<TVoidResult>
  ): Promise<void> {
    this._running += 1;

    // eslint-disable-next-line no-constant-condition
    main: for (true; true; true) {
      if (this._failed) break main;
      try {
        const result = await method();

        result.lazy();

        if (sleep !== null) await new Promise((res) => setTimeout(res, sleep));
      } catch (error) {
        console.log(`Operation ${method.name} failure for '${description}' `);
        console.log(error);
        this._failed = true;
        break main;
      }
    }

    this._running -= 1;
  }
}
