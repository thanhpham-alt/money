-- CreditCard: thay thisMonth bằng lịch trả theo tháng (monthly + dueDay + startDate + adjust)
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_CreditCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bank" TEXT NOT NULL,
    "principal" REAL NOT NULL DEFAULT 0,
    "monthly" REAL NOT NULL DEFAULT 0,
    "dueDay" INTEGER NOT NULL DEFAULT 5,
    "startDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "adjust" REAL NOT NULL DEFAULT 0,
    "fixedOnly" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "new_CreditCard" ("id","bank","principal","fixedOnly","sortOrder","createdAt","updatedAt")
SELECT "id","bank","principal","fixedOnly","sortOrder","createdAt","updatedAt" FROM "CreditCard";

DROP TABLE "CreditCard";
ALTER TABLE "new_CreditCard" RENAME TO "CreditCard";

PRAGMA foreign_keys=ON;
