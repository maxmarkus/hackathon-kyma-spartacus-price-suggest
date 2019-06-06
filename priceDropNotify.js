/*
  received event
  {
    code: 3965240,
    oldPrice: 50.0,
    newPrice: 10.0
  }
  */
 function priceDropNotify(eventRaw, context) {
    const log = (a,b,c,d,e,g) => {
      console.log('=='+ a,b,c,d,e,g);
    }
    const version = '0.4';
    log('version', version);
    const event = eventRaw.data;
    
    // redis
    const bluebird = require('bluebird');
    const request = require('request');
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
          .then(res => {
            console.log('== received from redis', res);
            return JSON.parse(res);
          })
          .catch((e) => {
            console.error('getAsync error', e);
            return false;
          });
      },
      // add: (key, value) => {
      //   return store.get(key).then((old) => {
      //     const values = (old || []).filter(o => o.email !== value.email);
      //     values.push(value);
      //     return store.setList(key, values);
      //   })
      //   .catch((e) => {
      //     console.error('getAsync error', e);
      //     return false;
      //   });
      // },
      // setList: (key, values) => {
      //   return redis.setAsync(key, JSON.stringify(values)).then((result) => {
      //     console.log('results for', key,'->', result);
      //     return true;
      //   })
      //   .catch((e) => {
      //     console.error('setAsync error', e);
      //     return false;
      //   });
      // }
    }

    const baseUrl = 'api.cqz1m-softwarea1-d44-public.model-t.cc.commerce.ondemand.com'; // old ccv2
      // const baseUrl = 'dev-com-17.accdemo.b2c.ydev.hybris.com:9002';
      const getDataFromCatalog = (code) => {
        const request = require('request');
        return new Promise((resolve, reject) => {
          const fetchUrl = `https://${baseUrl}/rest/v2/electronics-spa/products/${code}?fields=code,price,name,description,url,manufacturer`;
          log('FETCHING', fetchUrl);
          process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // ignore certificate errors
          request(fetchUrl, function (error, response, body) { // Print the HTML for the Google homepage.
            if(error) {
              log('ERROR', error.statusCode, error.body);
              reject(JSON.parse(error));
            }
            log('fetched from electronics-spa', JSON.parse(body));
            resolve(JSON.parse(body));
          });
        })
      }

    const sendEmail = (data) => {
      return new Promise((resolve, reject) => {

        // console.log('sending email', data);

        var options = {
          method: 'POST',
          url: 'https://edenhauser.com/kyma-mailer/',
          headers: 
          {
            // Connection: 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          form: data 
        };

        // request(options, function (error, response, body) {
        request.post(options.url, {
          form: data
        }, function (error, response, body) {
          if (error) {
            log('not ok', data.email);
            resolve({email: data.email, error: error});
            return;
          } 
          log('ok', data.email, body);
          resolve(data.email);
          return;
        });
      });
    };
    log('getting for product', event.code);
    return Promise.all([
      store.get(event.code),
      getDataFromCatalog(event.code)
    ])
    .then((data) => {
      log('data', data);
      const entries = data[0];
      const product = data[1];
      log('store for', event.code, 'has', entries.length, 'subscribers');
      return {
        entries: (entries || []).filter(e => parseInt(e.price) >= event.newPrice),
        product: product
      };
    })
    .then((data) => {
      const promises = [];
      log('checking data', event.code, 'for', data);
      log('sending email', event.code, 'for', data.entries.length, 'subscribers');
      data.entries.forEach(entry => {
        log('sending email to', entry.email);
        promises.push(
          sendEmail(Object.assign({}, data.product, {
            email: entry.email,
            price: event.newPrice,
            oldPrice: event.oldPrice,
            'hidden-secret': true
          }))
        );
      });
      return Promise.all(promises).then(res => {
        return {
          sent: res,
          version: version
        }
      });
    })
    .catch((err) => {
      console.error('err', err);
    });
 } 


module.exports = priceDropNotify;