import type { TCommand, TVariables } from '../registries/commands';
import { validate } from '../validate';

type TRegistryCommandOptions =
  | {
      cmd: 'ADD';
      reg: string;
      var: string;
    }
  | {
      cmd: 'ADD-M';
      reg: string;
      var: string[];
    }
  | {
      cmd: 'IN' | 'NOT-IN';
      else?: TCommand[];
      reg: string;
      then?: TCommand[];
      var: string;
    }
  | {
      cmd: 'REG';
      reg: string;
    }
  | {
      cmd: 'UNREG';
      reg: string;
    }
  | {
      cmd: 'ALL';
      every: TCommand[];
      reg: string;
      var: string;
    };

const registries: Map<string, Set<string>> = new Map();

export function execute(
  options: TRegistryCommandOptions,
  vars: TVariables
): void {
  const reg = registries.get(vars.defineVariable(options.reg));

  console.log(`$ registry ${vars.defineVariable(options.reg)} ${options.cmd}`);

  switch (options.cmd) {
    case 'ADD-M':
    case 'ADD':
      {
        if (!reg) {
          console.log('rule fail:', options.reg, 'no registry was created.');
          process.exit(1);
        }

        const arr = Array.isArray(options.var) ? options.var : [options.var];
        for (const v of arr) {
          reg.add(vars.defineVariable(v));
        }
      }
      break;

    case 'IN':
    case 'NOT-IN':
      {
        if (!reg) {
          console.log('rule fail:', options.reg, 'no registry was created.');
          process.exit(1);
        }

        const isIn = reg.has(vars.defineVariable(options.var));

        if ((options.cmd === 'IN') === isIn) {
          if (options.then !== undefined) {
            vars.validate(options.then, vars);
          }
        } else {
          if (options.else !== undefined) {
            vars.validate(options.else, vars);
          }
        }
      }
      break;

    case 'REG':
      {
        if (reg) {
          console.log(
            'rule fail:',
            options.reg,
            'registry was already created.'
          );
          process.exit(1);
        }

        registries.set(vars.defineVariable(options.reg), new Set());
      }
      break;

    case 'UNREG':
      {
        if (!reg) {
          console.log('rule fail:', options.reg, 'registry was never created.');
          process.exit(1);
        }

        registries.delete(vars.defineVariable(options.reg));
      }
      break;

    case 'ALL':
      {
        if (!reg) {
          console.log('rule fail:', options.reg, 'registry was never created.');
          process.exit(1);
        }

        for (const el of reg) {
          validate(options.every, vars.addVariables({ [options.var]: el }));
        }
      }
      break;
  }
}
