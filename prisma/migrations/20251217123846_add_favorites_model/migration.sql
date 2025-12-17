-- CreateTable
CREATE TABLE "favorites" (
    "id" SERIAL NOT NULL,
    "sellerId" INTEGER NOT NULL,
    "adId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "favorites_sellerId_adId_key" ON "favorites"("sellerId", "adId");

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_adId_fkey" FOREIGN KEY ("adId") REFERENCES "ads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
