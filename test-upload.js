const fs = require('fs');
const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const data = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.glb"\r\nContent-Type: model/gltf-binary\r\n\r\ndummy\r\n--${boundary}--\r\n`;

const req = http.request({
  hostname: 'localhost',
  port: 8081,
  path: '/api/admin/cultural-map/models/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Status:', res.statusCode, 'Body:', body));
});

req.on('error', (e) => console.error('Error:', e.message));
req.write(data);
req.end();

