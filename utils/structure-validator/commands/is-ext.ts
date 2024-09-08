import type { TVariables } from '../registries/commands';

interface IIsExtensionCommandOptions {
  ext: string;
  file: string;
}

export function execute(
  options: IIsExtensionCommandOptions,
  vars: TVariables
): void {
  const replaced = vars.defineVariable(options.file);

  console.log(`$ is-ext ${replaced} ${options.ext}`);
  const ext = replaced.split('.').splice(1).join('.');

  if (ext !== options.ext) {
    console.log('rule fail', replaced, 'does not end with: ', options.ext);
    process.exit(1);
  }
}
