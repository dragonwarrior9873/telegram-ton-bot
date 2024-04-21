const axios = require('axios');
const { url_pair_info, url_wallet_info } = require('./constant');

// Data to be sent in the POST request
const postData = {
    wallet_address: 'John',
    mnemonics: 'Doe'
};

const pairData = {
    pairContract: 'John',
    sell_limit: 4,
    buy_limit: 3
};



// Making a POST request using Axios
axios.get(url_pair_info)
  .then(response => {
    console.log('Response:', response.data);
  })
  .catch(error => {
    console.error('Error:', error);
  });