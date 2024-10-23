import fs from 'fs';
import url from 'url';
import path from 'path';

const __filename = url.fileURLToPath(import.meta.url),
  __dirname = path.dirname(__filename);

const domainsSource = path.join(__dirname, '../src/app');
const tokensPath = path.join(domainsSource, '../components/tokens/app');

for (const domain of fs.readdirSync(domainsSource)) {
  const currentDomain = {
    controllers: {},
    factories: {},
    aggregates: {
      // user: {
      //   factory: '',
      //   mapper: '',
      //   root: ''
      // }
    },
    repositories: {}
  };

  const currentDomainPath = path.join(domainsSource, domain);

  if (fs.existsSync(path.join(currentDomainPath, 'application/controllers'))) {
    for (const controller of fs.readdirSync(
      path.join(currentDomainPath, 'application/controllers')
    )) {
      if (controller === 'index.ts') continue;

      const fileName = controller.split('.')[0];
      const controllerName =
        fileName.replace(/-[a-z]/g, (v) => v.slice(1).toUpperCase()) +
        'Controller';

      currentDomain.controllers[controllerName] =
        `app:${domain}:controllers:${fileName}`;
    }
  }

  for (const factory of fs.readdirSync(
    path.join(currentDomainPath, 'factories')
  )) {
    if (factory === 'index.ts') continue;

    const fileName = factory.split('.')[0];

    const factoryName =
      fileName.replace(/-[a-z]/g, (v) => v.slice(1).toUpperCase()) + 'Factory';

    currentDomain.factories[factoryName] =
      `app:${domain}:factories:${fileName}`;
  }

  for (const repository of fs.readdirSync(
    path.join(currentDomainPath, 'repositories')
  )) {
    if (repository === 'index.ts') continue;

    const fileName = repository.split('.')[0];

    const factoryName =
      fileName.replace(/-[a-z]/g, (v) => v.slice(1).toUpperCase()) +
      'Repository';

    currentDomain.repositories[factoryName] =
      `app:${domain}:repositories:${factoryName}`;
  }

  fs.writeFileSync(
    path.join(tokensPath, `${domain}.json`),
    JSON.stringify(currentDomain, null, 2)
  );
}

await import('./create-dir-exports.js');
