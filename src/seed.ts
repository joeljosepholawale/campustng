import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const defaultCategories = [
    'Textbooks',
    'Electronics',
    'Dorm Essentials',
    'Services',
    'Clothing',
    'Hostel Accommodation',
    'Past Questions'
];

async function main() {
    console.log('Starting DB Seed...');

    for (const name of defaultCategories) {
        await prisma.category.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }

    console.log('Categories seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
