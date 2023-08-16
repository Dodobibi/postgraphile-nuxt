export default defineNuxtConfig({
  typescript: {
    tsConfig: {
      compilerOptions: {
        moduleResolution: "bundler",
      },
    },
  },
  modules: ["../src/module"],
  postgraphile: {
    presetPath: "@/server/graphile.config",
  },
  devtools: { enabled: true },
});
