import path from 'path';
import url from 'url';

export const constants = {
  root: path.dirname(url.fileURLToPath(import.meta.url))
};
