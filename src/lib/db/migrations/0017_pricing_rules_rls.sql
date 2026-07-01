-- Hand-written migration. Same rationale as prior RLS migrations.
ALTER TABLE "markup_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "discount_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "tax_rules" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "customer_pricing_agreements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "approval_thresholds" ENABLE ROW LEVEL SECURITY;
