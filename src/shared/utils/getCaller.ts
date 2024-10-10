import path from 'path';
import { constants } from '@constants';

export interface TApplicationCaller {
  domain: string;
  //Needed sometimes
  relativePath: string;
  type: 'domain';
}
// | {
//     service: string;
//     type: 'service';
//   };

// export function getCallerPath(): string {
//   const originalPrepareStackTrace = Error.prepareStackTrace;

//   Error.prepareStackTrace = (_, stack): NodeJS.CallSite[] => stack;
//   const err = new Error();
//   const stack = err.stack as unknown as NodeJS.CallSite[];

//   Error.prepareStackTrace = originalPrepareStackTrace;

//   const target = stack[2]!;

//   return target.getFileName()!;
// }

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
      domain,
      relativePath
    };
  }

  // if (target.includes('/services/')) {
  // }

  throw new Error('Caller is not an application caller.');
}
