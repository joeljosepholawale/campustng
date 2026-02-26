import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const schools = await prisma.school.findMany();
    console.log(`Found ${schools.length} schools in the database.`);
    console.log(schools);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
