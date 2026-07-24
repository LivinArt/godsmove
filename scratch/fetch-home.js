const http = require('http');

http.get('http://localhost:3000/', (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log(`HTML Length: ${data.length}`);
    if (data.includes('Void Tee')) {
      console.log('Void Tee found in HTML!');
    } else {
      console.log('Void Tee NOT found in HTML.');
    }
    if (data.includes('Echo Tee')) {
      console.log('Echo Tee found in HTML!');
    } else {
      console.log('Echo Tee NOT found in HTML.');
    }
    // Print first 500 characters of body or check for errors
    const bodyIdx = data.indexOf('<body');
    if (bodyIdx !== -1) {
      console.log('Body snippet:', data.slice(bodyIdx, bodyIdx + 1000));
    }
  });
}).on('error', (err) => {
  console.error('Error fetching home:', err.message);
});
