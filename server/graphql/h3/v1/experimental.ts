import type { App } from "h3";

import type { IncomingMessage, Server as HTTPServer } from "node:http";
import type { Server as HTTPSServer } from "node:https";
import type { Duplex } from "node:stream";

import type { GrafservConfig } from "postgraphile/grafserv";
import { makeNodeUpgradeHandler } from "postgraphile/grafserv/node";

import { H3Grafserv as H3GrafservBase } from ".";

export class H3Grafserv extends H3GrafservBase {
  constructor(config: GrafservConfig) {
    super(config);
  }

  async getUpgradeHandler() {
    if (this.resolvedPreset.grafserv?.websockets) {
      return makeNodeUpgradeHandler(this);
    } else {
      return null;
    }
  }

  shouldHandleUpgrade(req: IncomingMessage, _socket: Duplex, _head: Buffer) {
    const fullUrl = req.url;
    if (!fullUrl) {
      return false;
    }
    const q = fullUrl.indexOf("?");
    const url = q >= 0 ? fullUrl.substring(0, q) : fullUrl;
    const graphqlPath = this.dynamicOptions.graphqlPath;
    return url === graphqlPath;
  }

  public async addTo_experimental(
    app: App,
    server: HTTPServer | HTTPSServer | undefined,
    addExclusiveWebsocketHandler = true
  ) {
    super.addTo(app);

    if (addExclusiveWebsocketHandler && server) {
      await this.attachWebsocketsToServer(server);
    }
  }

  public async attachWebsocketsToServer(server: HTTPServer | HTTPSServer) {
    const grafservUpgradeHandler = await this.getUpgradeHandler();
    if (grafservUpgradeHandler) {
      const upgrade = (req: IncomingMessage, socket: Duplex, head: Buffer) => {
        if (this.shouldHandleUpgrade(req, socket, head)) {
          grafservUpgradeHandler(req, socket, head);
        } else {
          socket.destroy();
        }
      };
      server.on("upgrade", upgrade);
      this.onRelease(() => {
        server.off("upgrade", upgrade);
      });
    }
  }
}

export function grafserv(config: GrafservConfig) {
  return new H3Grafserv(config);
}
