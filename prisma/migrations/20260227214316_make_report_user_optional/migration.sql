-- DropForeignKey
ALTER TABLE "reports" DROP CONSTRAINT "reports_reportedUserId_fkey";

-- AlterTable
ALTER TABLE "reports" ALTER COLUMN "reportedUserId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
