#!/bin/bash

# Exit on error
set -e

echo "=== Starting fresh sequential git push script ==="

# Reset git repository history
if [ -d .git ]; then
  echo "Clearing existing git repository history..."
  rm -rf .git
fi

echo "Initializing a new git repository..."
git init

echo "Setting remote origin..."
git remote add origin https://github.com/Abhinavgupta2025/Aasammed.git
git branch -M main

# Commit 1: Clean start with README.md
echo "--- Step 1: Initializing repository with README ---"
git add README.md
git commit -m "init: initialize project repository with README"
echo "Force pushing Step 1 to clear remote repository history..."
git push -f -u origin main

echo "Waiting 2 minutes before Step 2..."
sleep 120

# Commit 2: Config files
echo "--- Step 2: Staging Project Configurations ---"
git add package.json package-lock.json tsconfig.json next.config.mjs postcss.config.mjs .eslintrc.json .gitignore next-env.d.ts .env.example || true
git commit -m "chore: configure project development environments and configuration files" || true
echo "Pushing Step 2..."
git push origin main

echo "Waiting 2 minutes before Step 3..."
sleep 120

# Commit 3: Prisma schema and migrations
echo "--- Step 3: Staging Prisma Schema & Migrations ---"
git add prisma/ || true
git commit -m "feat: add neon database schema migrations and product seed script" || true
echo "Pushing Step 3..."
git push origin main

echo "Waiting 2 minutes before Step 4..."
sleep 120

# Commit 4: Auth & registration endpoints
echo "--- Step 4: Staging NextAuth and Register endpoints ---"
git add src/lib/auth.ts src/app/api/auth/ src/app/signup/ src/app/login/ src/middleware.ts src/types/next-auth.d.ts || true
git commit -m "feat: implement secure user registration flow and protect dashboard routes with NextAuth" || true
echo "Pushing Step 4..."
git push origin main

echo "Waiting 2 minutes before Step 5..."
sleep 120

# Commit 5: Styling, theme settings and units conversions base
echo "--- Step 5: Staging Styles and Conversion helpers ---"
git add tailwind.config.ts src/app/globals.css src/lib/units.ts src/lib/prisma.ts src/lib/serialize.ts || true
git commit -m "style: map dark professional medical palette and implement pure math conversion utility" || true
echo "Pushing Step 5..."
git push origin main

echo "Waiting 2 minutes before Step 6..."
sleep 120

# Commit 6: Homepage & Layout skeleton
echo "--- Step 6: Staging Layout and Homepage ---"
git add src/app/layout.tsx src/app/providers.tsx src/app/page.tsx src/app/dashboard/layout.tsx src/app/dashboard/page.tsx || true
git commit -m "feat: build dashboard shell drawer layouts and custom home display banner" || true
echo "Pushing Step 6..."
git push origin main

echo "Waiting 2 minutes before Step 7..."
sleep 120

# Commit 7: Product Catalog & Search
echo "--- Step 7: Staging Catalog Search View & API ---"
git add src/app/api/products/ src/app/dashboard/products/page.tsx src/lib/useDebounce.ts || true
git commit -m "feat: implement search endpoint and responsive product catalog with URL filters state" || true
echo "Pushing Step 7..."
git push origin main

echo "Waiting 2 minutes before Step 8..."
sleep 120

# Commit 8: Live preview Selector & product details
echo "--- Step 8: Staging Quantity Selector & detail views ---"
git add src/components/QuantitySelector.tsx src/app/dashboard/products/[id]/ || true
git commit -m "feat: create QuantitySelector live conversion breakdown and product spec details view" || true
echo "Pushing Step 8..."
git push origin main

echo "Waiting 2 minutes before Step 9..."
sleep 120

# Commit 9: Cart Page & order placement APIs
echo "--- Step 9: Staging Checkout Cart & order routing ---"
git add src/app/dashboard/cart/page.tsx src/app/api/orders/route.ts src/app/dashboard/orders/page.tsx || true
git commit -m "feat: add cart equivalent items listing and handle server-side checkout orders in transactions" || true
echo "Pushing Step 9..."
git push origin main

echo "Waiting 2 minutes before Step 10..."
sleep 120

# Commit 10: Admin dashboards
echo "--- Step 10: Staging Admin panel & audit card details ---"
git add src/app/admin/ || true
git commit -m "feat: build administrator stock monitoring and order conversion audit trail panels" || true
echo "Pushing Step 10..."
git push origin main

echo "=== All sequenced groups pushed to GitHub successfully ==="
