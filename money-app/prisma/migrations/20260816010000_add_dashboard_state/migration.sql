-- CreateTable
CREATE TABLE "DashboardState" (
    "id" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "revision" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DashboardState_pkey" PRIMARY KEY ("id")
);
