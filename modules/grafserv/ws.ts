import { serv } from "@/server/grafserv/serv";

export default defineNitroPlugin(async (nitroApp) => {
  // This hook (request) is new !!! (since h3@1.8.0 / nitro@2.6.1)
  // We subscribe to it only once for catching the root node server on prod only
  // @ts-expect-error callback function is never (wrongly typed)...
  nitroApp.hooks.hookOnce("request", (event: H3Event) => {
    const server = event.node.req.socket.server;
    if (server) {
      serv.attachWebsocketsToServer_experimental(server);
    }
  });
  // TODO: Make a first request for handling this at startup (fetch http://*****)
});
