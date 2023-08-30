import { makeExtendSchemaPlugin, gql } from "postgraphile/utils";
import { context, lambda, listen } from "postgraphile/grafast";
import { jsonParse } from "postgraphile/@dataplan/json";

const MySubscriptionPlugin = makeExtendSchemaPlugin((build) => {
  return {
    typeDefs: /* GraphQL */ gql`
      extend type Subscription {
        forumMessage(forumId: Int!): ForumMessageSubscriptionPayload
      }

      type ForumMessageSubscriptionPayload {
        event: String
        sub: Int
        id: Int
      }
    `,
    plans: {
      Subscription: {
        forumMessage: {
          subscribePlan(_$root, args) {
            const $pgSubscriber = context().get("pgSubscriber");
            const $forumId = args.get("forumId");
            const $topic = lambda($forumId, (id) => `forum:${id}:message`);
            return listen($pgSubscriber, $topic, jsonParse);
          },
          plan($event) {
            return $event;
          },
        },
      },
      ForumMessageSubscriptionPayload: {
        event($event) {
          return $event.get("event");
        },
        sub($event) {
          return $event.get("sub");
        },
        id($event) {
          return $event.get("id");
        },
      },
    },
  };
});

export default MySubscriptionPlugin;
