import fs from 'fs';
import path from 'path';
import type { TCommand, TVariables } from '../registries/commands';

interface IReaddirCommandOptions {
  directory: string;
  every?: TCommand[];
  extensionless?: string;
  filter?: 'dir-only' | 'file-only';
  skip?: string[];
  variable: string;
}

export function execute(
  options: IReaddirCommandOptions,
  vars: TVariables
): void {
  const toRead = vars.defineVariable(path.join(vars.root, options.directory));

  console.log(`$ readdir ${toRead}`);

  const subs = fs.readdirSync(toRead);

  for (const sub of subs) {
    if (Array.isArray(options.skip) && options.skip.includes(sub)) continue;

    const fullSub = path.join(toRead, sub);

    if (options.filter) {
      const stat = fs.statSync(fullSub);

      switch (options.filter) {
        case 'dir-only':
          {
            if (!stat.isDirectory()) {
              console.log('rule fail:', fullSub, 'is not a directory.');
              process.exit(1);
            }
          }
          break;

        case 'file-only':
          {
            if (!stat.isFile()) {
              console.log('rule fail:', fullSub, 'is not a file.');
              process.exit(1);
            }
          }
          break;
      }
    }

    if (Array.isArray(options.every)) {
      let moddedVars = vars.addVariables({ [options.variable]: sub });

      if (options.extensionless)
        moddedVars = moddedVars.addVariables({
          [options.extensionless]: sub.split('.')[0]
        });

      vars.validate(options.every, moddedVars);
    }
  }
}
