import type { TCommand, TVariables } from './registries/commands';

export const logs = {
  warn(options: { message: string }, vars: TVariables): void {
    console.log('WARN: ', vars.defineVariable(options.message));
  },
  error(options: { message: string }, vars: TVariables): void {
    console.log('ERROR: ', vars.defineVariable(options.message));
    process.exit(1);
  }
};

export function validate(commands: TCommand[], vars: TVariables): void {
  for (const command of commands) {
    if (command.command in logs) {
      logs[command.command as 'warn'](command as any, vars);
    } else {
      const execute = vars.registries.commands.get(command.command);

      if (execute === undefined) {
        console.log('command not found:', command.command);
        process.exit(1);
      }

      execute(command, vars);
    }
  }
}
