import {
  defineNuxtModule,
  createResolver,
  addServerHandler,
  resolvePath,
} from "@nuxt/kit";

import { resolvePresets } from "graphile-config";

// Module options TypeScript interface definition
export interface ModuleOptions {
  presetPath: string;
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: "postgraphile-module",
    configKey: "postgraphile",
  },
  // Default configuration options of the Nuxt module
  defaults: {
    presetPath: "@/graphile.config", //'../playground/graphile.config'
  },
  async setup(options, nuxt) {
    const resolver = createResolver(import.meta.url);
    const runtimeDir = resolver.resolve("./runtime");
    nuxt.options.build.transpile.push(runtimeDir + "/serv");
    const presetPath = await resolvePath(options.presetPath);

    nuxt.options.alias["#postgraphile-preset"] = presetPath;

    const preset = (await import(presetPath)).default;
    const resolvedPreset = resolvePresets([preset]);
    const {
      graphqlPath = "/graphql",
      graphqlOverGET = false,
      graphiql = true,
      graphiqlOnGraphQLGET = true,
      graphiqlPath = "/graphiql",
      watch = false,
      eventStreamPath = "/graphql/stream",
    } = resolvedPreset.grafserv || {};

    addServerHandler({
      route: graphiqlPath,
      method: "post",
      handler: resolver.resolve("./runtime/handlers/handleGraphqlEvent"),
    });

    if (
      graphqlOverGET ||
      graphiqlOnGraphQLGET ||
      graphqlPath === eventStreamPath
    )
      addServerHandler({
        route: graphqlPath,
        method: "get",
        handler:
          watch && graphqlPath === eventStreamPath
            ? resolver.resolve("./runtime/handlers/handleEvent")
            : resolver.resolve("./runtime/handlers/handleGraphqlEvent"),
      });

    if (graphiql && graphqlPath !== graphiqlPath)
      addServerHandler({
        route: graphiqlPath,
        method: "get",
        handler: resolver.resolve("./runtime/handlers/handleGraphiqlEvent"),
      });

    if (watch && graphqlPath !== eventStreamPath)
      addServerHandler({
        route: eventStreamPath,
        method: "get",
        handler: resolver.resolve("./runtime/handlers/handleEventStreamEvent"),
      });

    if (watch) {
      // /**
      //  * Register websockets in DEV mode.,
      //  */
      if (nuxt.options.dev) {
        nuxt.hook("listen", async (server) => {
          // TODO: Attach ws to "root" server
          // Howto pass this server in ./runtime/handlers/register-ws for registering ws ???
        });
      }
      // if (nuxt.options.dev) {
      //   nuxt.options.nitro.devHandlers = nuxt.options.nitro.devHandlers || [];
      //   nuxt.options.nitro.devHandlers.push({
      //     handler: await import(
      //       resolver.resolve("./runtime/handlers/register-ws")
      //     ),
      //   });
      // }
      // nuxt.hook("nitro:config", async (config) => {
      //   config.devHandlers = config.devHandlers || [];
      //   config.devHandlers.push({
      //     handler: await import(
      //       resolver.resolve("./runtime/handlers/register-ws")
      //     ),
      //   });
      // });

      // /**
      //  * Register websockets in PRODUCTION mode,
      //  */
      if (!nuxt.options.dev)
        // Only in prod, because 'event.node.req.socket.server' is DevServer in dev mode,
        // and ws doesn't reply on DevServer
        addServerHandler({
          handler: resolver.resolve("./runtime/handlers/register-ws"),
          middleware: true,
        });
    }
  },
});
