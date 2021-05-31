var fs = require('fs');
var path = require('path');
const { OperatorNotFound, InvalidValue, WrongType } = require('./errors');

const pathDir = __dirname;

const routes = (request, response, ledis) => {
  if (request.method === 'GET') {
    var filePath = request.url;
    if (filePath == '/') {
      filePath = '/index.html';
    }
    filePath = './public' + filePath;
    var extname = String(path.extname(filePath)).toLowerCase();
    var mimeTypes = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.wav': 'audio/wav',
        '.mp4': 'video/mp4',
        '.woff': 'application/font-woff',
        '.ttf': 'application/font-ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '.otf': 'application/font-otf',
        '.wasm': 'application/wasm'
    };
    const contentType = mimeTypes[extname];
    fs.readFile(filePath, function (error, content) {
      if (error) {
        if (error.code == 'ENOENT') {
          fs.readFile('./404.html', function (error, content) {
            response.writeHead(404, { 'Content-Type': 'text/html' });
            response.end(content, 'utf-8');
          });
        }
        else {
          response.writeHead(500);
          response.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
        }
      }
      else {
        response.writeHead(200, { 'Content-Type': contentType });
        response.end(content, 'utf-8');
      }
    })
    // response.statusCode = 200;
    // response.write('OK');
    // return response.end();
  } else if (request.method === 'POST' && request.body && typeof request.body === 'object') {
    try {
      const result = ledis.store(request.body);
      response.setHeader('Content-Type', 'application/json');
      if (result !== null) {
        response.write(JSON.stringify({ result }));
      }
      response.statusCode = 200;
    }
    catch (error) {
      switch (error.name) {
        case OperatorNotFound.name:
          response.statusCode = 404;
          break;
        case WrongType.name:
        case InvalidValue.name:
          response.statusCode = 400;
          break;
        default:
          response.statusCode = 500;
          break;
      }

      response.write(`ERROR: ${error.name} ${error.message}`)
    }
    return response.end();
  }
}

module.exports = routes;