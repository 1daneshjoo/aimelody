/**
 * Entry point for cPanel / Phusion Passenger (standalone deploy).
 * Application startup file in Setup Node.js App: server.js
 */
const { createServer } = require("http");
const { parse } = require("url");
const path = require("path");

process.env.NODE_ENV = "production";
process.chdir(__dirname);

const next = require("next");
const app = next({ dev: false, dir: __dirname });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    if (typeof PhusionPassenger !== "undefined") {
      PhusionPassenger.configure({ autoInstall: false });
      server.listen("passenger");
      console.log("> AiMelody ready on Passenger");
    } else {
      const port = Number(process.env.PORT) || 3000;
      server.listen(port, "0.0.0.0", () => {
        console.log(`> AiMelody ready on http://127.0.0.1:${port}`);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
