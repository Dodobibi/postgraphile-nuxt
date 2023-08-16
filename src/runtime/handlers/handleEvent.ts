import { defineEventHandler } from "h3";
import { serv } from "../serv";

export default defineEventHandler(async (event) => {
  return await serv.handleEvent(event);
});
