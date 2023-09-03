import { createServer } from "node:http";
import { createApp, toNodeListener } from "h3";
import { grafserv } from "./server/grafserv/h3/v1";

import preset from "./server/grafserv/graphile.config";
import { schema } from "./server/grafserv/schema.mjs";

// create a h3 app
const app = createApp();
// (Add any h3 eventHandlers you want here.)

// Create a Node HTTP server, mounting h3 into it
const server = createServer(toNodeListener(app));
server.on("error", (e) => {
  console.error(e);
});

// Create a Grafserv instance
const serv = grafserv({ schema, preset });

// Add the Grafserv instance's route handlers to the h3 app
serv.addTo_experimental(app, server).catch((e) => {
  console.error(e);
  process.exit(1);
});

// Start the server
server.listen(preset.grafserv?.port ?? 5678);
