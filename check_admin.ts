import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const admins = await prisma.user.findMany({
        where: { isAdmin: true }
    });
    console.log("Admins:", JSON.stringify(admins, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
