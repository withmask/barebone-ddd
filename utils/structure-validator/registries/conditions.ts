import fs from 'fs';
import path from 'path';
import url from 'url';
import type { TVariables } from './commands';
import type { TCondition } from '../commands/if';

const dirname = path.dirname(url.fileURLToPath(import.meta.url));

export const conditions: Map<
  string,
  (options: TCondition, vars: TVariables) => boolean
> = new Map();

const files = fs.readdirSync(path.join(dirname, '../conditions'));

for (const file of files) {
  const full = path.join(dirname, '../conditions', file),
    parsed = path.parse(full);

  if (parsed.ext !== '.js') continue;

  const { execute } = await import(full);

  conditions.set(parsed.name, execute);
}
