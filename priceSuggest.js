/*
  {
      productCode: 300938
      suggestedPrice: 9.0
  }
  */
 function priceSuggestLambda(event, context) {
    const priceOkTreshhold = 15; // % of accepted price

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
    return getPriceFromCatalog(parseInt(input.productCode)).then((result) => {
        console.log('getPriceFromCatalog result', typeof result);
        const price = result.price.value;
        const suggestedPrice = parseInt(input.suggestedPrice);
        const reducedPrice = price - (price / 100 * priceOkTreshhold);
        const priceOk = suggestedPrice >= reducedPrice;
        // console.log('POST', reducedPrice, suggestedPrice, priceOk);
        return { suggestedPrice: suggestedPrice, priceAccepted: priceOk, productCode: result.code, name: result.name, 
            version: "0.3"
        };
    });
} 



module.exports = priceSuggestLambda;