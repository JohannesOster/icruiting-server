ALTER TABLE tenant
  ADD CONSTRAINT valid_subscription_state CHECK(stripe_subscription_id IS NULL OR stripe_subscription_status IS NOT NULL);
