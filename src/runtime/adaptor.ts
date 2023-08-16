/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */
import type { App, H3Event } from "h3";
import { createRouter, eventHandler } from "h3";
import {
  getMethod,
  getQuery,
  getRequestHeaders,
  getRequestProtocol,
  readRawBody,
  sendStream,
  setResponseHeader,
  setResponseHeaders,
  setResponseStatus,
} from "h3";

import type { IncomingMessage, Server as HTTPServer } from "node:http";
import type { Server as HTTPSServer } from "node:https";
import type { Duplex } from "node:stream";
import { PassThrough } from "node:stream";

import { makeNodeUpgradeHandler } from "postgraphile/grafserv/node";

import {
  convertHandlerResultToResult,
  GrafservBase,
  normalizeRequest,
  processHeaders,
} from "postgraphile/grafserv";
import type {
  EventStreamHeandlerResult,
  GrafservBodyBuffer,
  GrafservConfig,
  RequestDigest,
  Result,
} from "postgraphile/grafserv";

declare global {
  namespace Grafast {
    interface RequestContext {
      h3v1: {
        event: H3Event;
      };
    }
  }
}

export class H3GrafservBase extends GrafservBase {
  constructor(config: GrafservConfig) {
    super(config);
  }

  protected getDigest(event: H3Event): RequestDigest {
    const req = event.node.req;
    const res = event.node.res;
    return {
      httpVersionMajor: req.httpVersionMajor,
      httpVersionMinor: req.httpVersionMinor,
      isSecure: getRequestProtocol(event) === "https",
      method: getMethod(event),
      path: event.path,
      headers: processHeaders(getRequestHeaders(event)),
      getQueryParams() {
        return getQuery(event) as Record<string, string | string[]>;
      },
      async getBody() {
        const buffer = await readRawBody(event, false);
        if (!buffer) {
          throw new Error("Failed to retrieve body from h3");
        }
        return {
          type: "buffer",
          buffer,
        } as GrafservBodyBuffer;
      },
      requestContext: {
        h3v1: {
          event,
        },
        node: {
          req,
          res,
        },
      },
    };
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

  public async handleEvent(event: H3Event) {
    const digest = this.getDigest(event);

    // Handle EventStream request (watch)
    if (
      this.resolvedPreset.grafserv?.watch &&
      digest.headers["accept"] === "text/event-stream"
    ) {
      const stream = this.makeStream();
      const result = await convertHandlerResultToResult({
        type: "event-stream",
        request: normalizeRequest(digest),
        dynamicOptions: this.dynamicOptions,
        payload: stream,
        statusCode: 200,
      });
      return this.send(event, result);
    }

    // Handle graphql or graphiql

    const handlerResult = await this.graphqlHandler(
      normalizeRequest(digest),
      this.graphiqlHandler
    );
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(event, result);
  }

  public async handleGraphqlEvent(event: H3Event) {
    const digest = this.getDigest(event);
    const handlerResult = await this.graphqlHandler(
      normalizeRequest(digest),
      this.graphiqlHandler
    );
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(event, result);
  }

  public async handleGraphiqlEvent(event: H3Event) {
    const digest = this.getDigest(event);
    const handlerResult = await this.graphiqlHandler(normalizeRequest(digest));
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(event, result);
  }

  public async handleEventStreamEvent(event: H3Event) {
    const digest = this.getDigest(event);
    // TODO: refactor this to use the eventStreamHandler once we write that...
    const handlerResult: EventStreamHeandlerResult = {
      type: "event-stream",
      request: normalizeRequest(digest),
      dynamicOptions: this.dynamicOptions,
      payload: this.makeStream(),
      statusCode: 200,
    };
    const result = await convertHandlerResultToResult(handlerResult);
    return this.send(event, result);
  }

  public async send(event: H3Event, result: Result | null) {
    if (result === null) {
      // 404
      setResponseStatus(event, 404);
      return "¯\\_(ツ)_/¯";
    }

    switch (result.type) {
      case "error": {
        const { statusCode, headers } = result;
        setResponseHeaders(event, headers);
        setResponseStatus(event, statusCode);
        // DEBT: mutating the error is probably bad form...
        const errorWithStatus = Object.assign(result.error, {
          status: statusCode,
        });
        throw errorWithStatus;
      }
      case "buffer": {
        const { statusCode, headers, buffer } = result;
        setResponseHeaders(event, headers);
        setResponseStatus(event, statusCode);
        return buffer;
      }
      case "json": {
        const { statusCode, headers, json } = result;
        setResponseHeaders(event, headers);
        setResponseStatus(event, statusCode);
        return json;
      }
      case "noContent": {
        const { statusCode, headers } = result;
        setResponseHeaders(event, headers);
        setResponseStatus(event, statusCode);
        return null;
      }
      case "bufferStream": {
        const { statusCode, headers, lowLatency, bufferIterator } = result;
        let bufferIteratorHandled = false;
        try {
          if (lowLatency) {
            event.node.req.socket.setTimeout(0);
            event.node.req.socket.setNoDelay(true);
            event.node.req.socket.setKeepAlive(true);
          }
          setResponseHeaders(event, headers);
          setResponseStatus(event, statusCode);
          const stream = new PassThrough();
          sendStream(event, stream).catch((e) => {
            console.error("An error occured when streaming to h3:");
            console.error(e);
          });

          // Fork off and convert bufferIterator to
          try {
            bufferIteratorHandled = true;
            for await (const buffer of bufferIterator) {
              stream.write(buffer);
            }
          } finally {
            stream.end();
          }
        } catch (e) {
          if (!bufferIteratorHandled) {
            try {
              if (bufferIterator.return) {
                bufferIterator.return();
              } else if (bufferIterator.throw) {
                bufferIterator.throw(e);
              }
            } catch (e2) {
              /* nom nom nom */
            }
          }
          throw e;
        }

        return;
      }
      default: {
        const never: never = result;
        console.log("Unhandled:");
        console.dir(never);
        setResponseHeader(event, "Content-Type", "text/plain");
        setResponseStatus(event, 503);
        return "Server hasn't implemented this yet";
      }
    }
  }

  public attachWebsocketsToServer = async (
    server: HTTPServer | HTTPSServer
  ) => {
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
  };
}

export class H3Grafserv extends H3GrafservBase {
  async addTo(
    app: App,
    server: HTTPServer | HTTPSServer | undefined,
    addExclusiveWebsocketHandler = true
  ) {
    const router = createRouter();
    const dynamicOptions = this.dynamicOptions;

    const graphqlEvent =
      this.dynamicOptions.watch &&
      this.dynamicOptions.graphqlPath === this.dynamicOptions.eventStreamPath
        ? (event: H3Event) => this.handleEvent(event)
        : (event: H3Event) => this.handleGraphqlEvent(event);

    router.use(
      this.dynamicOptions.graphqlPath,
      eventHandler((event) => graphqlEvent(event)),
      this.dynamicOptions.graphqlOverGET ||
        this.dynamicOptions.graphiqlOnGraphQLGET ||
        this.dynamicOptions.graphqlPath === this.dynamicOptions.eventStreamPath
        ? ["get", "post"]
        : ["post"]
    );

    if (
      dynamicOptions.graphiql &&
      this.dynamicOptions.graphqlPath !== this.dynamicOptions.graphiqlPath
    ) {
      router.get(
        this.dynamicOptions.graphiqlPath,
        eventHandler((event) => this.handleGraphiqlEvent(event))
      );
    }

    if (
      dynamicOptions.watch &&
      this.dynamicOptions.graphqlPath !== this.dynamicOptions.eventStreamPath
    ) {
      router.get(
        this.dynamicOptions.eventStreamPath,
        eventHandler((event) => this.handleEventStreamEvent(event))
      );
    }

    app.use(router);

    if (addExclusiveWebsocketHandler && server) {
      await this.attachWebsocketsToServer(server);
    }
  }
}

export function grafserv(config: GrafservConfig) {
  return new H3Grafserv(config);
}
