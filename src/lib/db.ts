import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/*
 * Query logging used to be on unconditionally, which prints every SQL statement
 * — including bound email addresses and payment references — into production
 * logs. Errors and warnings only, outside development.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db