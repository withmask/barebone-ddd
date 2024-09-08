import fs from 'fs';
import path from 'path';

import type { TVariables } from '../registries/commands';

interface IStructureCommandOptions {
  dirs: string[];
  files: string[];
  optional: { dirs: string[]; files: string[] };
  root: string;
  skip: string[];
}

export function execute(
  options: IStructureCommandOptions,
  vars: TVariables
): void {
  const sub = vars.defineVariable(options.root);
  console.log('$ structure', sub);

  const full = path.join(vars.root, sub);

  const seen: { [key: string]: 0 } = {};

  for (const dir of options.dirs) {
    const dirPath = path.join(full, dir);

    if (!fs.existsSync(dirPath)) {
      console.log('rule fail', dirPath, 'does not exist.');
      process.exit(1);
    }

    const stat = fs.statSync(dirPath);

    if (!stat.isDirectory()) {
      console.log('rule fail', dirPath, 'is not a directory');
      process.exit(1);
    }

    seen[dir] = 0;
  }

  for (const file of options.files) {
    if (file in seen) {
      console.log('config fail', file, 'is seen in multiple structure configs');
      process.exit(1);
    }

    const filePath = path.join(full, file);

    if (!fs.existsSync(filePath)) {
      console.log('rule fail', filePath, 'does not exist.');
      process.exit(1);
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      console.log('rule fail', filePath, 'is not a file.');
      process.exit(1);
    }

    seen[file] = 0;
  }

  for (const dir of options.optional.dirs) {
    if (dir in seen) {
      console.log('config fail', dir, 'is seen in multiple structure configs');
      process.exit(1);
    }

    const dirPath = path.join(full, dir);

    if (!fs.existsSync(dirPath)) {
      console.log('rule skip:', dirPath, 'does not exist.');
      continue;
    }

    const stat = fs.statSync(dirPath);

    if (!stat.isDirectory()) {
      console.log('rule fail', dirPath, 'is not a directory');
      process.exit(1);
    }

    seen[dir] = 0;
  }

  for (const file of options.optional.files) {
    if (file in seen) {
      console.log('config fail', file, 'is seen in multiple structure configs');
      process.exit(1);
    }

    const filePath = path.join(full, file);

    if (!fs.existsSync(filePath)) {
      console.log('rule skip', filePath, 'does not exist.');
      continue;
    }

    const stat = fs.statSync(filePath);

    if (!stat.isFile()) {
      console.log('rule fail', filePath, 'is not a file.');
      process.exit(1);
    }

    seen[file] = 0;
  }

  for (const dirContent of fs.readdirSync(full)) {
    if (dirContent in seen) continue;
    if (options.skip.includes(dirContent)) continue;
    console.log('unexpected dir or file:', dirContent, 'in:', full);
    process.exit(1);
  }
}
