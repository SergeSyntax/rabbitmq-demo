import { promisify } from 'node:util';

export const delay = promisify(setTimeout);
