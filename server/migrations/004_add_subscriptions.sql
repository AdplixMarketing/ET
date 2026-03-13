ALTER TABLE users ADD COLUMN plan VARCHAR(10) DEFAULT 'free' CHECK (plan IN ('free', 'pro'));
ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255);
ALTER TABLE users ADD COLUMN stripe_subscription_id VARCHAR(255);
ALTER TABLE users ADD COLUMN plan_expires_at TIMESTAMPTZ;
