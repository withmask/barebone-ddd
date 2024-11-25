declare module 'sort-route-paths' {
  const sort: <T>(types: T[], key?: keyof T) => T[];

  export default sort;
}
