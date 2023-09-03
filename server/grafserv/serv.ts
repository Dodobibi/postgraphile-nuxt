import { grafserv } from "./h3/v1";

// import { postgraphile } from "postgraphile";
// ___ or ___
import { schema } from "./schema.mjs";

import preset from "./graphile.config";

// export const pgl = postgraphile(preset);
// export const serv = pgl.createServ(grafserv);
// ___ or ___
export const serv = grafserv({ schema, preset });
