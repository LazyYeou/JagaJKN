// Reset/seed performs multiple table writes and baseline evaluations atomically.
// Hosted PostgreSQL round trips can exceed Prisma's default 5-second budget.
// Keep this allowance scoped to seed/reset, rather than all application writes.
export const DEMO_SEED_TRANSACTION_OPTIONS = {
  maxWait: 10_000,
  timeout: 120_000,
} as const;
