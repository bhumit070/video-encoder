import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  PORT: z
    .preprocess((val) => Number(val), z.number())
    .optional()
    .default(8080),
  DATABASE_URL: z.string().min(1),
  NODE_ENV: z.string().optional().default("DEVELOPMENT"),
});

export const config = envSchema.parse(process.env);
