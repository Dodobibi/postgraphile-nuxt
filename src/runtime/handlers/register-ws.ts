import { defineEventHandler } from "h3";
import { serv } from "../serv";

let wsInitialized = false;
export default defineEventHandler(async (event) => {
  if (!wsInitialized) {
    wsInitialized = true;
    console.log("Registering websockets on server (prod)");
    await serv.attachWebsocketsToServer(
      // @ts-expect-error server no typed on net.Socket
      event.node.req.devServer || event.node.req.socket.server
    );
  }
});
