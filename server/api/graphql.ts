import { serv } from "@/server/grafserv/serv";

export default eventHandler((event) => {
  return serv.handleGraphqlEvent(event);
});
