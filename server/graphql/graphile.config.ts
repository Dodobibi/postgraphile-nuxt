import "postgraphile";

import { PostGraphileAmberPreset } from "postgraphile/presets/amber";
import { makePgService } from "postgraphile/adaptors/pg";

import MySubscriptionPlugin from "./plugins/eventSubscription";

const preset: GraphileConfig.Preset = {
  extends: [PostGraphileAmberPreset],
  plugins: [MySubscriptionPlugin],
  pgServices: [
    makePgService({
      connectionString: `${process.env.DATABASE_URL}`,
      superuserConnectionString: `${process.env.DATABASE_URL}`,
      schemas: ["public"],
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
