import { postgraphile } from "postgraphile";
import { grafserv } from "./h3/v1/experimental";

import preset from "./graphile.config";

export const pgl = postgraphile(preset);
export const serv = pgl.createServ(grafserv);
