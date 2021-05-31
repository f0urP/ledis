const http = require('http');
const routes = require('./routes');
const { Database } = require('./lib/data');
const Ledis = require('./lib/ledis');

const host = 3000;
const database = new Database();
const ledis = new Ledis(database);


const bodyParser = (req, res, cb) => {
  let body = '';
  req.on('data', chunk => {
    body += chunk.toString();
  })
  req.on('end', () => {
    if (req.headers['content-type'] === 'application/json') {
      try {
        req.body = JSON.parse(body)
      } catch {
        console.error(`Can't parser body ${body}`)
      }
    }
    cb(req, res);
  })
}

http.createServer((request, response) => {
  bodyParser(request, response, ((req, res) => 
    routes(req, res, ledis)
  ))
}).listen(host, () => {
  console.info(`Ledis is running on port ${3000}`)
});