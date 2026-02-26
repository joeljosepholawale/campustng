import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = [
    { name: 'Books & Notes', description: 'Textbooks, course notes, study guides, novels' },
    { name: 'Electronics', description: 'Laptops, phones, tablets, chargers, accessories' },
    { name: 'Furniture', description: 'Desks, chairs, beds, shelves, room decor' },
    { name: 'Fashion', description: 'Clothing, shoes, bags, accessories' },
    { name: 'Food & Snacks', description: 'Homemade meals, snacks, drinks, groceries' },
    { name: 'Stationery', description: 'Pens, notebooks, art supplies, printing' },
    { name: 'Health & Beauty', description: 'Skincare, haircare, gym equipment, supplements' },
    { name: 'Sports & Fitness', description: 'Sports gear, gym accessories, jerseys' },
    { name: 'Tickets & Events', description: 'Concert tickets, party passes, event invites' },
    { name: 'Housing', description: 'Hostel spaces, off-campus rooms, apartments' },
    { name: 'Transportation', description: 'Bicycles, scooters, ride shares' },
    { name: 'Other', description: 'Anything that doesn\'t fit the categories above' },
];

async function seedCategories() {
    console.log(`📦 Seeding ${CATEGORIES.length} product categories...`);

    let created = 0;

    for (const cat of CATEGORIES) {
        await prisma.category.upsert({
            where: { name: cat.name },
            update: { description: cat.description },
            create: { name: cat.name, description: cat.description },
        });
        created++;
    }

    console.log(`✅ Done! ${created} categories seeded.`);
}

seedCategories()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
