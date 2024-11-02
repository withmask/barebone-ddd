import { register } from 'module';
import { pathToFileURL } from 'url';

register('./include/loader.js', pathToFileURL('./'));

await import('./main.js');
// /* eslint-disable max-classes-per-file */
