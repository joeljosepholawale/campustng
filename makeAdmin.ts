import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const emailToMakeAdmin = process.argv[2];

async function main() {
    if (!emailToMakeAdmin) {
        console.error("Please provide an email address. Example: npx ts-node makeAdmin.ts admin@example.com");
        return;
    }

    const user = await prisma.user.update({
        where: { email: emailToMakeAdmin },
        data: { isAdmin: true },
    });

    console.log(`Successfully made ${user.email} an admin!`);
}

main()
    .catch((e) => {
        console.error("Error updating user:", e.message);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
