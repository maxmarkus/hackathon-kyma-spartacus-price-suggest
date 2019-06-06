/*
  POST /suggestemail
  {
    "productCode": "3965240",
    "suggestedPrice": "140",
    "email": "admin+1@kyma.cx" (optional)
  }
  returns:
    {
        "accepted": true (without email)
        "subscribed": true (with email)
        ...
    }
  error to high suggestion:
    {
      "productCode": 3965240,
      "error": "Your pricelimit of 2113 is set to high, you can immediately buy it already for 204"
    }

    installing: INSIDELAMBDA
  */
  function priceSuggestEmail(event, context) {
    const priceOkTreshhold = 15; // % of accepted price for immediate ok

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
          console.log('== stored for', key, values.length);
          return store.setList(key, values);
        })
        .catch((e) => {
          console.error('getAsync error', e);
          return false;
        });
      },
      setList: (key, values) => {
        return redis.setAsync(key, JSON.stringify(values)).then((result) => {
          console.log('results for', key,'->', result);
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


    const newPrice = event.data;

    const request = require('request');
    const input = event.data;
      const baseUrl = 'api.cqz1m-softwarea1-d44-public.model-t.cc.commerce.ondemand.com'; // old ccv2
      // const baseUrl = 'dev-com-17.accdemo.b2c.ydev.hybris.com:9002';
      const getPriceFromCatalog = (code) => {
        return new Promise((resolve, reject) => {
          const fetchUrl = `https://${baseUrl}/rest/v2/electronics-spa/products/${code}?fields=code,price,name`;
          console.log('==FETCHING', fetchUrl);
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore certificate errors
          request(fetchUrl, function (error, response, body) { // Print the HTML for the Google homepage.
            if(error) {
              console.log('ERROR', error.statusCode, error.body);
              reject(JSON.parse(error));
            }
            console.log('fetched from electronics-spa', JSON.parse(body));
            resolve(JSON.parse(body));
          });
        })
      }


    
    const addPriceWatch = (input) => {
      console.log('addPriceWatch', input);
      const newSubscriber = {
        email: input.email,
        price: input.suggestedPrice
      };
      return store.add(input.productCode, newSubscriber);
    };
    const code = parseInt(input.productCode);
    return getPriceFromCatalog(code).then((result) => {
        console.log('getPriceFromCatalog result', typeof result);
        const price = parseInt(result.price.value);
        const suggestedPrice = parseInt(input.suggestedPrice);

        const suggestionToHigh = suggestedPrice >= price;
        if (suggestionToHigh) {
          return Promise.resolve({
            productCode: code,
            error: `Your pricelimit of ${suggestedPrice} is set to high, you can immediately buy it already for ${price}`
          });
        }

        const version = '0.2';

        if(!input.email) {
          console.log('getPriceFromCatalog result', typeof result);
          const price = result.price.value;
          const suggestedPrice = parseInt(input.suggestedPrice);
          const reducedPrice = price - (price / 100 * priceOkTreshhold);
          const priceOk = suggestedPrice >= reducedPrice;
          // console.log('POST', reducedPrice, suggestedPrice, priceOk);
          return {
            suggestedPrice: suggestedPrice,
            priceAccepted: priceOk,
            productCode: code,
            name: result.name, 
            version: version
          };
        }

        return addPriceWatch(input).then((res) => {
          return {
            subscribed: res,
            productCode: code,
            suggestedPrice: suggestedPrice,
            name: result.name, 
            version: version
          }
        });
    });
} 



module.exports = priceSuggestEmail;