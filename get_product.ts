import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const product = await prisma.product.findFirst({
        select: { id: true, title: true }
    });
    console.log('RESULT:' + JSON.stringify(product));
}

main().finally(() => prisma.$disconnect());
