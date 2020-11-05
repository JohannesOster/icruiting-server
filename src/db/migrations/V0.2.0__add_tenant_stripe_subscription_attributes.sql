ALTER TABLE tenant
  ADD COLUMN stripe_subscription_id TEXT DEFAULT NULL,
  ADD COLUMN stripe_subscription_status TEXT DEFAULT NULL;