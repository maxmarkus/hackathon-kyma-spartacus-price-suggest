const bluebird = require('bluebird');
let redis;
if (process.env.PORT) {
  redis = require('redis');
  bluebird.promisifyAll(redis.RedisClient.prototype);
  bluebird.promisifyAll(redis.Multi.prototype);
  module.exports = redis.createClient({host: process.env.HOST, port: process.env.PORT, password: process.env.REDIS_PASSWORD});
} else {
  redis = require('redis-mock');
  bluebird.promisifyAll(redis.RedisClient.prototype);
  bluebird.promisifyAll(redis.Multi.prototype);
  module.exports = redis.createClient();
}