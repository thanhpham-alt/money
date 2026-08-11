-- CreateTable
CREATE TABLE "BluescopeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "qty" INTEGER NOT NULL DEFAULT 1,
    "halfDay" REAL NOT NULL DEFAULT 0,
    "fullDay" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BluescopeEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL DEFAULT '',
    "briefBy" TEXT,
    "deliverDate" DATETIME,
    "brief" TEXT,
    "eventType" TEXT,
    "photographers" INTEGER NOT NULL DEFAULT 0,
    "videographers" INTEGER NOT NULL DEFAULT 0,
    "recapClips" INTEGER NOT NULL DEFAULT 0,
    "duration" TEXT,
    "shootCost" REAL NOT NULL DEFAULT 0,
    "editCost" REAL NOT NULL DEFAULT 0,
    "discount" REAL NOT NULL DEFAULT 0,
    "paidByUs" REAL NOT NULL DEFAULT 0,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BluescopePackage" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "BluescopePackageItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "packageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unit" TEXT,
    "qty" REAL NOT NULL DEFAULT 1,
    "unitPrice" REAL NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BluescopePackageItem_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "BluescopePackage" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BluescopeContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "channel" TEXT NOT NULL DEFAULT 'EXTERNAL',
    "name" TEXT NOT NULL DEFAULT '',
    "contentType" TEXT,
    "publishDate" DATETIME,
    "originalCost" REAL,
    "finalCost" REAL,
    "scope" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "BluescopeEvent_eventType_idx" ON "BluescopeEvent"("eventType");

-- CreateIndex
CREATE INDEX "BluescopePackageItem_packageId_idx" ON "BluescopePackageItem"("packageId");

-- CreateIndex
CREATE INDEX "BluescopeContent_channel_idx" ON "BluescopeContent"("channel");
