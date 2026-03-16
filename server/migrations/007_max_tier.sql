-- Update plan constraint to include 'max'
DO $$ BEGIN
  -- Drop old constraint and add new one
  ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
  ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'max'));
EXCEPTION WHEN OTHERS THEN
  -- If constraint doesn't exist by that name, try to add it
  ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'max'));
END $$;

-- Add stripe_price_id for tracking which price was purchased
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'stripe_price_id') THEN
    ALTER TABLE users ADD COLUMN stripe_price_id VARCHAR(255);
  END IF;
END $$;
