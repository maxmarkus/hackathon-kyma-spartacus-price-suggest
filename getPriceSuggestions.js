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
    const redis = require('./redis');
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
      }
    }
    return store.get(input.productCode);
  } 



module.exports = getPriceSuggestions