import fs from 'fs';
import path from 'path';
import { constants } from '@constants';

import 'components';
import 'shared';

const dirs = await fs.promises.readdir(path.join(constants.root, 'app'));

for (const dir of dirs) {
  await import(`app/${dir}`);
}
