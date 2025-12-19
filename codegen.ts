import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: {
    [process.env.NEXT_PUBLIC_HASURA_ENDPOINT ||
    "http://localhost:8080/v1/graphql"]: {
      headers: {
        "x-hasura-admin-secret": process.env.HASURA_ADMIN_SECRET || "",
      },
    },
  },
  documents: ["lib/graphql/queries/**/*.ts"],
  generates: {
    "./lib/graphql/__generated__/": {
      preset: "client",
      config: {
        useTypeImports: true,
        enumsAsTypes: true,
        skipTypename: false,
        scalars: {
          uuid: "string",
          timestamptz: "string",
          jsonb: "Record<string, unknown>",
          Int: "number",
          Float: "number",
          Boolean: "boolean",
          String: "string",
          question_category: '"behavioral" | "technical" | "system_design" | "leadership" | "problem_solving" | "company_specific"',
          difficulty_level: '"easy" | "medium" | "hard"',
          session_status: "string",
          subscription_status: "string",
          subscription_tier: "string",
          payment_provider: "string",
        },
      },
    },
  },
  ignoreNoDocuments: true,
};

export default config;
