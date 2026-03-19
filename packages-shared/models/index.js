import mongoose from 'mongoose';
import { config } from '../config/index.js';

/** Единое подключение для всех моделей. */
export const connection = mongoose.createConnection(config.mongodbUri);


import userSchema from './User.js';
import businessSchema from './Business.js';
import dialogSchema from './Dialog.js';
import newsSchema from './News.js';
import smsCodeSchema from './SmsCode.js';
import businessSubscriptionSchema from './BusinessSubscription.js';

const User = connection.model('User', userSchema);
const Business = connection.model('Business', businessSchema);
const Dialog = connection.model('Dialog', dialogSchema);
const News = connection.model('News', newsSchema);
const SmsCode = connection.model('SmsCode', smsCodeSchema);
const BusinessSubscription = connection.model('BusinessSubscription', businessSubscriptionSchema);

/** Промис готовности подключения к БД (await перед listen). */
export const ready = connection.asPromise();

export { config, User, Business, Dialog, News, SmsCode, BusinessSubscription };
