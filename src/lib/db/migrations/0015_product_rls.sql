-- Hand-written migration. Same rationale as prior RLS migrations.
ALTER TABLE "product_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "products" ENABLE ROW LEVEL SECURITY;
