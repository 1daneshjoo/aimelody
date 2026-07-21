/**
 * Entry point for cPanel / Phusion Passenger.
 * Application startup file in Setup Node.js App: server.js
 */
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    const server = createServer((req, res) => {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    });

    // cPanel uses Phusion Passenger — must listen on "passenger", not a port
    if (typeof PhusionPassenger !== "undefined") {
      PhusionPassenger.configure({ autoInstall: false });
      server.listen("passenger");
      console.log("> Ready on Passenger");
    } else {
      const port = Number(process.env.PORT) || 3000;
      server.listen(port, "0.0.0.0", () => {
        console.log(`> Ready on http://127.0.0.1:${port}`);
      });
    }
  })
  .catch((err) => {
    console.error("Failed to start Next.js server:", err);
    process.exit(1);
  });
