/*
  POST /suggestions
  {
      productCode: 300938
  }
  returns [
    {email, price}
  ]
  */
  function getPriceSuggestions(event, context) {
    console.log('getPriceSuggestions', event.data);

    // redis
    const input = event.data;
    
    // redis
    const bluebird = require('bluebird');
    let redisModule, redis;
    if (process.env.INSIDELAMBDA) { 
      redisModule = require('redis');
      bluebird.promisifyAll(redisModule.RedisClient.prototype);
      bluebird.promisifyAll(redisModule.Multi.prototype);
      redis = redisModule.createClient({host: process.env['suggestion-HOST'], port: process.env['suggestion-PORT'], password: process.env['suggestion-REDIS_PASSWORD']});
    } else {
      redisModule = require('redis-mock');
      bluebird.promisifyAll(redisModule.RedisClient.prototype);
      bluebird.promisifyAll(redisModule.Multi.prototype);
      redis = redisModule.createClient();
    }

    redis.on('error', function(err){
      console.log('Something went wrong ', err)
    });
    const store = {
      get: (key) => {
        return redis.getAsync(key)
          .then(res => (JSON.parse(res)))
          .catch((e) => {
            console.error('getAsync error', e);
            return false;
          });
      },
      add: (key, value) => {
        return store.get(key).then((old) => {
          const values = (old || []).filter(o => o.email !== value.email);
          values.push(value);
          return store.setList(key, values);
        })
        .catch((e) => {
          console.error('getAsync error', e);
          return false;
        });
      },
      setList: (key, values) => {
        return redis.setAsync(key, JSON.stringify(values)).then((result) => {
          return true;
        })
        .catch((e) => {
          console.error('setAsync error', e);
          return false;
        });
      },
      remove: (key) => {
        redis.del(key);
      }
    }

    return store.get(input.productCode);
  } 



module.exports = getPriceSuggestions