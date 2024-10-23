export interface IConfig {
  app: {
    domains: {
      user: {
        rules: {
          name: {
            maxNameLength: number;
            minNameLength: number;
          };
        };
      };
    };
  };
  drivers: {
    mongo: {
      connections: {
        [connection: string]: {
          domains: {
            [domain: string]: {
              collections: { [key: string]: string };
              database: string;
            }[];
          };
          uri: string;
        };
      };
    };
  };
}

//REPO: DOMAIN:REPO -> con:db:col
