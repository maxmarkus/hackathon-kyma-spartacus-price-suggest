const bluebird = require('bluebird');
let redisModule, redis;
if (process.env.PORT) {
  redisModule = require('redis');
  bluebird.promisifyAll(redisModule.RedisClient.prototype);
  bluebird.promisifyAll(redisModule.Multi.prototype);
  redis = redisModule.createClient({host: process.env.HOST, port: process.env.PORT, password: process.env.REDIS_PASSWORD});
} else {
  redisModule = require('redis-mock');
  bluebird.promisifyAll(redisModule.RedisClient.prototype);
  bluebird.promisifyAll(redisModule.Multi.prototype);
  redis = redisModule.createClient();
}