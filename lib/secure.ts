import crypto from 'crypto';
import { keys } from './init';

export const encrypt = value => crypto.createHmac('sha256', keys[0]).update(value).digest('hex');
