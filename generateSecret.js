import { randomBytes } from 'crypto';

const secret = randomBytes(32).toString('base64');
console.log(secret); 