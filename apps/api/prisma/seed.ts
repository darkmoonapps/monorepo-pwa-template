import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAKE_PLACEHOLDER_COUNT = 2;

async function seed(): Promise<void> {
  const existingCount = await prisma.prismaPlaceholder.count();
  if (existingCount > 0) {
    console.log(
      `Seed skipped: ${String(existingCount)} fake placeholder row(s) already exist.`
    );
    return;
  }

  await prisma.prismaPlaceholder.createMany({
    data: Array.from({ length: FAKE_PLACEHOLDER_COUNT }, () => ({})),
  });

  console.log(
    `Seeded ${String(FAKE_PLACEHOLDER_COUNT)} fake PrismaPlaceholder rows (no personal data).`
  );
}

async function main(): Promise<void> {
  try {
    await seed();
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
