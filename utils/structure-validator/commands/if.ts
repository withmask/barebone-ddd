import type { TCommand, TVariables } from '../registries/commands';

export interface TCondition {
  [key: string]: any;
  name: string;
}

export interface IfCommandOptions {
  condition: TCondition;
  else?: TCommand[];
  then?: TCommand[];
}

export function execute(options: IfCommandOptions, vars: TVariables): void {
  const handler = vars.registries.conditions.get(options.condition.name);

  if (handler === undefined) {
    console.log('condition not found:', options.condition.name);
    process.exit(1);
  }

  const result = handler(options.condition, vars);

  if (result) {
    if (options.then !== undefined) {
      vars.validate(options.then, vars);
    }
  } else {
    if (options.else !== undefined) {
      vars.validate(options.else, vars);
    }
  }
}
