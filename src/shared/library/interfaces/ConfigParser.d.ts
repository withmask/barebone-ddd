export interface IConfig {
  app: {
    domains: {
      user: {
        rules: {
          name: {
            maxNameLength: number;
            minNumberLength: number;
          };
        };
      };
    };
  };
}

export interface IConfigParser {
  readonly config: IConfig;
  readonly root: string;
}
