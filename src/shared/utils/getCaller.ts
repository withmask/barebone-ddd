import path from 'path';
import { constants } from '@constants';

export interface TApplicationCaller {
  name: string;
  relativePath: string;
  type: 'domain' | 'service' | 'interface';
}

export function getApplicationCaller(): TApplicationCaller {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = (_, stack): NodeJS.CallSite[] => stack;
  const err = new Error();
  const stack = err.stack as unknown as NodeJS.CallSite[];

  Error.prepareStackTrace = originalPrepareStackTrace;

  const target = stack[2]!.getFileName()!;

  if (target.includes('/app/')) {
    const [, domain]: string[] = target.match(/app\/([^/]+)\//)!;

    const domainRoot = path.join(constants.root, 'app', domain),
      relativePath = path.relative(domainRoot, target);

    return {
      type: 'domain',
      name: domain,
      relativePath
    };
  }

  if (target.includes('/services/')) {
    const [, service]: string[] = target.match(/services\/([^/]+)\//)!;

    const serviceRoot = path.join(constants.root, 'services', service),
      relativePath = path.relative(serviceRoot, target);

    return {
      type: 'service',
      name: service,
      relativePath
    };
  }

  if (target.includes('/interfaces/')) {
    const [, interfaceName]: string[] = target.match(/interfaces\/([^/]+)\//)!;

    const serviceRoot = path.join(constants.root, 'interface', interfaceName),
      relativePath = path.relative(serviceRoot, target);

    return {
      type: 'interface',
      name: interfaceName,
      relativePath
    };
  }

  throw new Error('Caller is not an application caller.');
}
