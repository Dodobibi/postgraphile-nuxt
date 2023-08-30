import { Server } from "http";

import { serv } from "./serv";

export default defineNitroPlugin(async (nitroApp) => {
  // Make a internal server for handling ws in runtime (isolated from buildtime)
  // module will proxy ws from root node server directly to it
  const server = new Server().listen({ port: 3100 }, () =>
    console.log("Runtime server listening on port 3100")
  );
  // on dev, when restarting, etc...
  nitroApp.hooks.hookOnce("close", () => {
    server.closeAllConnections();
    server.close((err) =>
      err
        ? console.warn("Runtime server wrongly closed", err)
        : console.log("Runtime server stopped")
    );
  });
  // finally, attach ws to it !!!
  serv.attachWebsocketsToServer(server);
});
