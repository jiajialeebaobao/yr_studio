CREATE TABLE "ClassSession" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "title" TEXT NOT NULL,
  "teacher" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "startsAt" DATETIME NOT NULL,
  "duration" INTEGER NOT NULL DEFAULT 60,
  "capacity" INTEGER NOT NULL DEFAULT 8,
  "minimum" INTEGER NOT NULL DEFAULT 3,
  "bookedCount" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "cancelReason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK ("kind" IN ('GROUP', 'PRIVATE')),
  CHECK ("status" IN ('OPEN', 'CONFIRMED', 'NOT_FORMED', 'CANCELED')),
  CHECK ("bookedCount" >= 0 AND "bookedCount" <= "capacity")
);
CREATE TABLE "Booking" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "tokenHash" TEXT NOT NULL,
  "idempotencyKey" TEXT NOT NULL,
  "fingerprint" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "canceledAt" DATETIME,
  CONSTRAINT "Booking_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "ClassSession" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CHECK ("status" IN ('ACTIVE', 'CANCELED', 'NOT_FORMED', 'SESSION_CANCELED'))
);
CREATE TABLE "AdminSession" ("id" TEXT NOT NULL PRIMARY KEY, "expiresAt" DATETIME NOT NULL);
CREATE TABLE "RateLimit" ("key" TEXT NOT NULL PRIMARY KEY, "count" INTEGER NOT NULL, "expiresAt" DATETIME NOT NULL);
CREATE INDEX "ClassSession_status_startsAt_idx" ON "ClassSession"("status", "startsAt");
CREATE UNIQUE INDEX "Booking_tokenHash_key" ON "Booking"("tokenHash");
CREATE UNIQUE INDEX "Booking_idempotencyKey_key" ON "Booking"("idempotencyKey");
CREATE INDEX "Booking_sessionId_phone_status_idx" ON "Booking"("sessionId", "phone", "status");
CREATE UNIQUE INDEX "Booking_active_phone_unique" ON "Booking"("sessionId", "phone") WHERE "status" = 'ACTIVE';
