import type { TCondition } from '../commands/if';
import type { TVariables } from '../registries/commands';

interface IAllConditionOptions {
  conditions: TCondition[];
}

export function execute(
  options: IAllConditionOptions,
  vars: TVariables
): boolean {
  for (const condition of options.conditions) {
    const handler = vars.registries.conditions.get(condition.name);

    if (handler === undefined) {
      console.log('condition not found:', condition.name);
      process.exit(1);
    }

    const result = handler(condition, vars);

    if (!result) return false;
  }

  return true;
}
