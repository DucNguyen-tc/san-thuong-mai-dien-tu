import { Client } from "@elastic/elasticsearch";
import { env } from "./env";

export const esClient = new Client({
  node: env.ELASTICSEARCH_URL,
  maxRetries: 3,
  requestTimeout: 10000,
});
