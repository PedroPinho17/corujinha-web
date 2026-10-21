-- Better Auth looks up / cascades by userId; Postgres does not index FKs by default.
CREATE INDEX "session_userId_idx" ON "session"("userId");
CREATE INDEX "account_userId_idx" ON "account"("userId");
