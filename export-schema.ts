import { exportSchema } from "graphile-export";
import { makeSchema } from "postgraphile";
import config from "./server/grafserv/graphile.config";

async function main() {
  const { schema } = await makeSchema(config);
  const exportFileLocation = `${__dirname}/server/grafserv/schema.mjs`;
  await exportSchema(schema, exportFileLocation, {
    mode: "graphql-js",
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
