-- Rename enum value VALIDATOR -> GENERATOR on both ReferrerType and
-- ReferredType. Using RENAME VALUE (not drop+add) so existing rows keep
-- their data — every row that was VALIDATOR now reads GENERATOR, nothing
-- is lost or requires a backfill.
ALTER TYPE "ReferrerType" RENAME VALUE 'VALIDATOR' TO 'GENERATOR';
ALTER TYPE "ReferredType" RENAME VALUE 'VALIDATOR' TO 'GENERATOR';
