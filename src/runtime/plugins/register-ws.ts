import type { NitroApp } from "nitropack";
import { useRuntimeConfig } from "#app";

// type stub
type NitroAppPlugin = (nitro: NitroApp) => void;

function defineNitroPlugin(def: NitroAppPlugin): NitroAppPlugin {
  return def;
}

import { serv } from "../serv";

export default defineNitroPlugin(async (nitroApp) => {
  const { httpServer } = useRuntimeConfig();

  // nitroApp.hooks.hook("render:html", async (r, { event }) => {
  //   console.log("Nitro pluginwww");
  //   console.log("Registering websocketgs on server (dev)");
  //   // @ts-expect-error server no typed on net.Socket
  if (httpServer) await serv.attachWebsocketsToServer(server);
  // });
});
