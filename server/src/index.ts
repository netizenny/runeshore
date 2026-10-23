import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3001);

createServer((req, res) => {
  if (req.url === '/health') {
    res.end('ok');
    return;
  }
  res.statusCode = 404;
  res.end();
}).listen(port, () => console.log(`runeshore server on :${port}`));
