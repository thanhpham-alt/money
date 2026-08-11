PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Settings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
    "cashOnHand" REAL NOT NULL DEFAULT 0,
    "invoiceFeeRate" REAL NOT NULL DEFAULT 0.04,
    "aTanShareRate" REAL NOT NULL DEFAULT 0.2,
    "bluescopeUrl" TEXT NOT NULL DEFAULT 'https://docs.google.com/spreadsheets/d/1ygn6O9Ej1-AmaeCVDOp6UD3pnbiyhG0c-ZUJ4MgNzdo/edit',
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("id", "cashOnHand", "invoiceFeeRate", "aTanShareRate", "bluescopeUrl", "updatedAt")
SELECT "id", "cashOnHand", "invoiceFeeRate", "aTanShareRate", "bluescopeUrl", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";

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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Job" ("id", "code", "jobType", "agency", "name", "status", "contractTotal", "collected", "externalUrl", "notes", "publicVisible", "sortOrder", "createdAt", "updatedAt")
SELECT "id", "code",
  CASE WHEN "code" = 'JOB_BLUESCOPE' THEN 'BLUESCOPE' ELSE 'AGENCY' END,
  "agency", "name", "status", "contractTotal", "collected", "externalUrl", "notes",
  CASE WHEN "code" = 'JOB_BLUESCOPE' THEN 1 ELSE 0 END,
  "sortOrder", "createdAt", "updatedAt"
FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE UNIQUE INDEX "Job_code_key" ON "Job"("code");
CREATE INDEX "Job_agency_idx" ON "Job"("agency");
CREATE INDEX "Job_status_idx" ON "Job"("status");
CREATE INDEX "Job_jobType_idx" ON "Job"("jobType");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
