import { GraphQLClient } from "graphql-request";

const HASURA_ENDPOINT =
  process.env.NEXT_PUBLIC_HASURA_ENDPOINT || "http://localhost:8080/v1/graphql";
const HASURA_ADMIN_SECRET = process.env.NEXT_PUBLIC_HASURA_ADMIN_SECRET || "";

export const graphqlClient = new GraphQLClient(HASURA_ENDPOINT, {
  headers: {
    ...(HASURA_ADMIN_SECRET && {
      "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
    }),
  },
});

/**
 * Authenticated GraphQL client with user token
 */
export function getAuthenticatedClient(token?: string) {
  return new GraphQLClient(HASURA_ENDPOINT, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(HASURA_ADMIN_SECRET && {
        "x-hasura-admin-secret": HASURA_ADMIN_SECRET,
      }),
    },
  });
}
