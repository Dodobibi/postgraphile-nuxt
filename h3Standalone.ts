import { createServer } from "node:http";
import { createApp, toNodeListener } from "h3";
import { serv } from "./server/graphql/serv";

const app = createApp();

const server = createServer(toNodeListener(app)).listen(
  process.env.PORT || 3000
);

serv.addTo(app, server);
