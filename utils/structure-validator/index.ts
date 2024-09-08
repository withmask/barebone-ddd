import fs from 'fs';
import url from 'url';
import path from 'path';
import { validate } from './validate';
import { conditions } from './registries/conditions';
import { commands as cReg } from './registries/commands';

import type { TCommand } from './registries/commands';

export const root = path.join(
  path.dirname(url.fileURLToPath(import.meta.url)),
  '../..'
);

const structurePath = path.join(root, 'include/structure.json');

const commands: TCommand[] = JSON.parse(
  fs.readFileSync(structurePath).toString()
);

validate(commands, {
  vars: {},
  root,
  validate,
  defineVariable(content: string): string {
    const self = this;
    return content.replace(/{([^}]+)}/g, (_, key) => {
      if (key in self.vars) {
        return self.vars[key];
      } else {
        throw new Error(`Key '${key}' not found in dictionary.`);
      }
    });
  },
  addVariables(dictionary) {
    return {
      ...this,
      vars: {
        ...this.vars,
        ...dictionary
      }
    };
  },
  registries: {
    commands: cReg,
    conditions
  }
});
