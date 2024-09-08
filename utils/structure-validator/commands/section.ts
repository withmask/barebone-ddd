import type { TCommand, TVariables } from '../registries/commands';
import { validate } from '../validate';

export interface ISectionCommandOptions {
  commands: TCommand[];
  name: string;
}

export function execute(
  options: ISectionCommandOptions,
  vars: TVariables
): void {
  console.log('# ', options.name);
  validate(options.commands, vars);
}
