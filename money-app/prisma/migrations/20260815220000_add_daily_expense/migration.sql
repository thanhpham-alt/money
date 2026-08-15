-- CreateTable
CREATE TABLE "DailyExpense" (
    "id" TEXT NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'expense',
    "amount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'khac',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "bankRef" TEXT,
    "bank" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DailyExpense_occurredAt_idx" ON "DailyExpense"("occurredAt");

-- CreateIndex
CREATE INDEX "DailyExpense_kind_idx" ON "DailyExpense"("kind");
