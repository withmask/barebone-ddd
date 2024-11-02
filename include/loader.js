import fs from 'fs';
import path from 'path';
import module from 'node:module';

export async function resolve(specifier, context, nextResolve) {
  if (
    !context.parentURL?.startsWith('file:') &&
    context.parentURL !== undefined
  )
    return await nextResolve(specifier, context);

  let link;

  // console.log(specifier);
  const parent = context.parentURL ? context.parentURL.slice(5) : process.cwd();

  if (module.isBuiltin(specifier) || specifier.endsWith('.js'))
    link = specifier;
  else {
    const fileDir = path.dirname(parent),
      modulePath = path.join(fileDir, specifier);

    if (!fs.existsSync(modulePath)) {
      const jsPath = modulePath + '.js';
      if (fs.existsSync(jsPath))
        return await nextResolve(modulePath + '.js', context);
      else return await nextResolve(specifier, context);
    }

    const stat = await fs.promises.stat(modulePath);

    if (stat.isDirectory()) link = path.join(modulePath, 'index.js');
    else return await nextResolve(specifier, context);
  }

  return await nextResolve(link, context);
}
