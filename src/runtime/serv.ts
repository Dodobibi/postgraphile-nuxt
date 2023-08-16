import { postgraphile } from "postgraphile";
import { grafserv } from "./adaptor";
import preset from "#postgraphile-preset";
const pgl = postgraphile(preset);
export const serv = pgl.createServ(grafserv);
