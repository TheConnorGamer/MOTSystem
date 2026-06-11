-- Premium garage fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "reminder_days_json" TEXT NOT NULL DEFAULT '[30,14,7,1]';

ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "photo_url" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "insurance_provider" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "insurance_policy_notes" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "warranty_expiry_date" TIMESTAMP(3);
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "warranty_notes" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "breakdown_expiry_date" TIMESTAMP(3);
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "breakdown_provider" TEXT;
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyre_change_date" TIMESTAMP(3);
ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "tyre_notes" TEXT;

CREATE TABLE IF NOT EXISTS "tyre_records" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "changed_date" TIMESTAMP(3) NOT NULL,
    "tread_depth" DOUBLE PRECISION,
    "brand" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tyre_records_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "tyre_records" DROP CONSTRAINT IF EXISTS "tyre_records_user_id_fkey";
ALTER TABLE "tyre_records" ADD CONSTRAINT "tyre_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tyre_records" DROP CONSTRAINT IF EXISTS "tyre_records_vehicle_id_fkey";
ALTER TABLE "tyre_records" ADD CONSTRAINT "tyre_records_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
