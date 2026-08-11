-- CreateTable
CREATE TABLE "JobAdvance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "paidAt" DATETIME,
    "amount" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobAdvance_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "LandFinance" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "capitalPartner" REAL NOT NULL DEFAULT 250000000,
    "capitalMine" REAL NOT NULL DEFAULT 700000000,
    "loanPartner" REAL NOT NULL DEFAULT 225000000,
    "loanMine" REAL NOT NULL DEFAULT 353000000,
    "loanTotalStart" REAL NOT NULL DEFAULT 573611101,
    "loanMonthlyAmort" REAL NOT NULL DEFAULT 3240741,
    "loanStartDate" DATETIME NOT NULL DEFAULT '2026-07-10 00:00:00 +00:00',
    "salePrice" REAL NOT NULL DEFAULT 1300000000,
    "loanCost1" REAL NOT NULL DEFAULT 12000000,
    "loanCost2" REAL NOT NULL DEFAULT 20000000,
    "saleCommissionPct" REAL NOT NULL DEFAULT 0.02,
    "partnerPrincipal" REAL NOT NULL DEFAULT 25000000,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CreditCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bank" TEXT NOT NULL,
    "principal" REAL NOT NULL DEFAULT 0,
    "thisMonth" REAL NOT NULL DEFAULT 0,
    "fixedOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_CreditCard" ("bank", "createdAt", "id", "principal", "sortOrder", "updatedAt") SELECT "bank", "createdAt", "id", "principal", "sortOrder", "updatedAt" FROM "CreditCard";
DROP TABLE "CreditCard";
ALTER TABLE "new_CreditCard" RENAME TO "CreditCard";
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "jobType" TEXT NOT NULL DEFAULT 'AGENCY',
    "agency" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Đang làm',
    "contractTotal" REAL NOT NULL DEFAULT 0,
    "collected" REAL NOT NULL DEFAULT 0,
    "externalUrl" TEXT,
    "notes" TEXT,
    "publicVisible" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "aTanAmount" REAL,
    "feeRate" REAL,
    "altFeeRate" REAL NOT NULL DEFAULT 0.08,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Job" ("agency", "code", "collected", "contractTotal", "createdAt", "externalUrl", "id", "jobType", "name", "notes", "publicVisible", "sortOrder", "status", "updatedAt") SELECT "agency", "code", "collected", "contractTotal", "createdAt", "externalUrl", "id", "jobType", "name", "notes", "publicVisible", "sortOrder", "status", "updatedAt" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_code_key" ON "Job"("code");
CREATE INDEX "Job_agency_idx" ON "Job"("agency");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_jobType_idx" ON "Job"("jobType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "JobAdvance_jobId_idx" ON "JobAdvance"("jobId");
