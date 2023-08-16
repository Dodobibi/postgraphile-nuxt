import "postgraphile";
import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { makePgService } from "postgraphile/adaptors/pg";

const preset: GraphileConfig.Preset = {
  extends: [PostGraphileAmberPreset],
  pgServices: [
    makePgService({
      connectionString: process.env.DATABASE_URL,
      schemas: [
        // schemas to expose
        "public",
        "app",
      ],
    }),
  ],
  grafserv: {
    graphiql: true,
    graphqlPath: "/api/graphql",
    eventStreamPath: "/api/graphql",
    graphiqlPath: "/api/graphql",
    graphiqlOnGraphQLGET: true,
    websockets: true,
    watch: true,
    graphqlOverGET: false,
  },
};

export default preset;
