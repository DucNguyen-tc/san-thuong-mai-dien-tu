import dotenv from "dotenv";
dotenv.config();

export const env = {
  PORT: process.env.PORT || 3008,
  NODE_ENV: process.env.NODE_ENV || "development",
  ELASTICSEARCH_URL: process.env.ELASTICSEARCH_URL || "http://localhost:9200",
  ELASTICSEARCH_INDEX: process.env.ELASTICSEARCH_INDEX || "products",
};
