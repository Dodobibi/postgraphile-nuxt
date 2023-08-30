import { postgraphile } from "postgraphile";
import { H3Grafserv, grafserv } from "./h3/v1";

import preset from "./graphile.config";

export const pgl = postgraphile(preset);
export const serv: H3Grafserv = pgl.createServ(grafserv);
