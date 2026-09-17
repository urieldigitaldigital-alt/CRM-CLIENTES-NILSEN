-- AlterTable
ALTER TABLE "User" ADD COLUMN "mercadoPagoPreapprovalId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_mercadoPagoPreapprovalId_key" ON "User"("mercadoPagoPreapprovalId");
