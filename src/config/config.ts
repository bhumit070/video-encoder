import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .preprocess((val) => Number(val), z.number())
    .optional()
    .default(8080),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.string().optional().default("DEVELOPMENT"),
  AWS_ACCESS_KEY: z.string().min(1),
  AWS_SECRET_KEY: z.string().min(1),
  AWS_DEFAULT_BUCKET: z.string().optional().default("test"),
  LOCAL_STACK_ENDPOINT_URL: z.string().min(1),
});

export const config = envSchema.parse(process.env);
