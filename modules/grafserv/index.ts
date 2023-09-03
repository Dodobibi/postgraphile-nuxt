import { defineNuxtModule, addServerPlugin } from "@nuxt/kit";

import httpProxy from "http-proxy";

export default defineNuxtModule({
  async setup(options, nuxt) {
    /**
     * Register websockets in DEVELOPMENT.
     */
    if (nuxt.options.dev) {
      nuxt.hook("listen", (listenerServer) => {
        const proxy = httpProxy.createProxy({
          target: {
            host: "localhost",
            port: 3100,
          },
        });
        listenerServer.on("upgrade", (req, socket, head) => {
          switch (req.url) {
            case "/api/graphql":
              // proxify this request to server create in runtime `ws-dev.ts`
              proxy.ws(req, socket, head);
              break;
            default:
              socket.destroy(); // Or do nothing if another handler must be called for handling ws on another path
          }
        });
      });
      addServerPlugin("@/modules/grafserv/ws-dev");
    }

    /**
     * Register websockets in PRODUCTION.
     */
    if (!nuxt.options.dev) addServerPlugin("@/modules/grafserv/ws");
  },
});
