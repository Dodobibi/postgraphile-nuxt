import { serv } from "@/server/graphql/serv";

export default eventHandler((event) => {
  // Because all are in the same endpoint (graphql, graphiql, and eventStream)
  if (getHeader(event, "accept") === "text/event-stream") {
    return serv.handleEventStreamEvent(event);
  }
  return serv.handleGraphqlEvent(event);
});
