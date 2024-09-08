import type { validate } from '../validate';
import type { conditions } from './conditions';

export interface TCommand {
  [key: string]: any;
  command: string;
}

export interface TVariables {
  registries: {
    commands: typeof commands;
    conditions: typeof conditions;
  };
  root: string;
  validate: typeof validate;
  vars: {
    [key: string]: string;
  };
  addVariables(dictionary: { [key: string]: string }): TVariables;
  defineVariable(content: string): string;
}

import fs from 'fs';
import path from 'path';
import url from 'url';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const commands: Map<string, (options: any, vars: TVariables) => void> =
  new Map();

const files = fs.readdirSync(path.join(dirname, '../commands'));

for (const file of files) {
  const full = path.join(dirname, '../commands', file),
    parsed = path.parse(full);

  if (parsed.ext !== '.js') continue;

  const { execute } = await import(full);

  commands.set(parsed.name, execute);
}
