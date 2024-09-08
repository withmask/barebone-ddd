import fs from 'fs';
import path from 'path';
import type { TVariables } from '../registries/commands';

interface INotEmptyConditionOptions {
  directory: string;
  ignore?: string[];
}

export function execute(
  options: INotEmptyConditionOptions,
  vars: TVariables
): boolean {
  const defined = vars.defineVariable(options.directory);

  console.log('? not-empty', defined);

  const paths = fs.readdirSync(path.join(vars.root, defined));

  for (const file of paths) {
    if (options.ignore && options.ignore.includes(file)) continue;

    return true;
  }

  return false;
}
