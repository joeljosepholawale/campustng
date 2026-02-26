require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const allSchools = await prisma.school.findMany();
    console.log('All schools:', allSchools);

    const approvedSchools = await prisma.school.findMany({
        where: { isApproved: true }
    });
    console.log('Approved schools:', approvedSchools);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
