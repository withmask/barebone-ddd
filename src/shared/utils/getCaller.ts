export function getCallerPath(): string {
  const originalPrepareStackTrace = Error.prepareStackTrace;

  Error.prepareStackTrace = (_, stack): NodeJS.CallSite[] => stack;
  const err = new Error();
  const stack = err.stack as unknown as NodeJS.CallSite[];

  Error.prepareStackTrace = originalPrepareStackTrace;

  const target = stack[2]!;

  return target.getFileName()!;
}
