import fs from 'fs';
import path from 'path';
import { constants } from '@constants';

const dirs = await fs.promises.readdir(path.join(constants.root, 'app'));

for (const dir of dirs) {
  await import(`app/${dir}`);
}
