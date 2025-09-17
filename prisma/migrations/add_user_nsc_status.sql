-- Add status field to UserNSC table for approval workflow
-- Migration: add_user_nsc_status

ALTER TABLE "user_nscs" ADD COLUMN "status" VARCHAR(20) DEFAULT 'ACTIVE';

-- Update existing records to be active
UPDATE "user_nscs" SET "status" = 'ACTIVE' WHERE "status" IS NULL;

-- Make status not null
ALTER TABLE "user_nscs" ALTER COLUMN "status" SET NOT NULL;
