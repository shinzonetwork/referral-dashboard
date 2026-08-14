-- AlterEnum
ALTER TYPE "ActorType" ADD VALUE 'SELF_SERVICE';

-- DropForeignKey
ALTER TABLE "ReferralLink" DROP CONSTRAINT "ReferralLink_createdByAdminId_fkey";

-- DropForeignKey
ALTER TABLE "Referrer" DROP CONSTRAINT "Referrer_createdByAdminId_fkey";

-- AlterTable
ALTER TABLE "ReferralLink" ALTER COLUMN "createdByAdminId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Referrer" ALTER COLUMN "createdByAdminId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Referrer" ADD CONSTRAINT "Referrer_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralLink" ADD CONSTRAINT "ReferralLink_createdByAdminId_fkey" FOREIGN KEY ("createdByAdminId") REFERENCES "Admin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
