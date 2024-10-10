import fs from 'fs';
import url from 'url';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

const source = path.join(__dirname, '../src');

const ignoreDirs = [];

const layers = fs.readdirSync(source);

const extensions = {
  'd.ts': (name) => ({
    ex: `export type * from './${name}.d';`
  }),
  ts: (name) => ({ ex: `export * from './${name}';` }),
  json: (name) => ({
    ex: `export { default as ${name}Tokens } from './${name}.json' assert { type: 'json' };`
  })
};

for (const layer of layers) {
  const fullLayer = path.join(source, layer),
    stat = fs.statSync(fullLayer);

  if (stat.isDirectory())
    processDir(
      fullLayer,
      layer === 'interface' || layer === 'app' || layer === 'drivers'
    );
}

function processDir(dir, noWrite = false) {
  if (ignoreDirs.some((ignore) => dir === path.join(source, ignore))) return;
  const subs = fs.readdirSync(dir),
    /**
     * @type {{dirs: string[], files: {name:string,ext:ext}[]}}
     */
    toExport = { dirs: [], files: [] };

  for (const sub of subs) {
    if (sub === 'index.ts' || sub === 'index.d.ts') continue;

    const fullSub = path.join(dir, sub),
      stat = fs.statSync(fullSub),
      isDir = stat.isDirectory();

    if (isDir) {
      processDir(fullSub);
      if (!ignoreDirs.some((ignore) => path.join(source, ignore) === fullSub))
        toExport.dirs.push(sub);
    } else {
      const [name, ...parts] = sub.split('.');

      const ext = parts.join('.');

      if (!(ext in extensions)) continue;

      toExport.files.push({ name, ext });
    }
  }

  const imports = [];

  let file = path.join(dir, 'index.ts'),
    content = [
      ...toExport.dirs

        .sort((a, b) =>
          a === 'core' ||
          a === 'tokens' ||
          a === 'components' ||
          a === 'library' ||
          a === 'structures'
            ? -1
            : a.localeCompare(b)
        )
        .map((v) => `export * from './${v}';`),
      '',
      ...toExport.files.sort().map((v) => {
        const lineGenerated = extensions[v.ext](v.name);

        if ('im' in lineGenerated) imports.push(lineGenerated.im);

        return lineGenerated.ex;
      })
    ]
      .join('\n')
      .trim();

  if (!content.length) content = 'export {};';

  if (imports.length > 0) content = `${imports.join('\n')}\n\n` + content;

  if (noWrite) {
    // console.log('NO:', file);
  } else {
    console.log(file);
    fs.writeFileSync(file, content + '\n');
  }
}
