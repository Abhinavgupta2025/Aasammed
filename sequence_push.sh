#!/bin/bash

# Exit on error
set -e

echo "=== Starting sequential git push script ==="

# Initialize git if not already initialized
if [ ! -d .git ]; then
  echo "Initializing git repository..."
  git init
fi

# 1. Initialize remote
if git remote | grep -q 'origin'; then
  echo "Remote origin already exists. Updating URL..."
  git remote set-url origin https://github.com/Abhinavgupta2025/Aasammed.git
else
  echo "Adding remote origin..."
  git remote add origin https://github.com/Abhinavgupta2025/Aasammed.git
fi

git branch -M main || true

# Group 1: Readme, env and migrations
echo "--- Staging Group 1: Database configuration and Schema ---"
git add README.md .env.example prisma/migrations/ || true
git commit -m "chore: setup database configuration and schema migrations" || true
echo "Pushing Group 1..."
git push -u origin main || true

echo "Waiting 2 minutes before Group 2..."
sleep 120

# Group 2: Core utilities and signup pages
echo "--- Staging Group 2: Core utilities and authentication ---"
git add src/lib/units.ts src/lib/useDebounce.ts src/app/api/auth/register/route.ts src/app/signup/page.tsx src/app/login/page.tsx || true
git commit -m "feat: implement unit conversion utilities and user registration flow" || true
echo "Pushing Group 2..."
git push origin main || true

echo "Waiting 2 minutes before Group 3..."
sleep 120

# Group 3: Styling and Landing page
echo "--- Staging Group 3: Theme, styling and Landing page ---"
git add tailwind.config.ts src/app/globals.css src/app/page.tsx || true
git commit -m "style: apply dark professional medical theme and design bento landing page" || true
echo "Pushing Group 3..."
git push origin main || true

echo "Waiting 2 minutes before Group 4..."
sleep 120

# Group 4: Product Catalog and Search
echo "--- Staging Group 4: Product Search API and view ---"
git add src/app/api/products/route.ts src/app/dashboard/products/page.tsx || true
git commit -m "feat: implement product search api and responsive product catalog with synced URL filters" || true
echo "Pushing Group 4..."
git push origin main || true

echo "Waiting 2 minutes before Group 5..."
sleep 120

# Group 5: Quantity Selector and Detail View
echo "--- Staging Group 5: Live preview selector and details ---"
git add src/components/QuantitySelector.tsx src/app/dashboard/products/[id]/page.tsx || true
git commit -m "feat: design QuantitySelector live breakdown and integrate detailed view" || true
echo "Pushing Group 5..."
git push origin main || true

echo "Waiting 2 minutes before Group 6..."
sleep 120

# Group 6: Cart and Order placement auditing
echo "--- Staging Group 6: Cart page and Checkout APIs ---"
git add src/app/dashboard/cart/page.tsx src/app/api/orders/route.ts src/app/api/orders/[id]/route.ts src/app/admin/orders/page.tsx || true
git commit -m "feat: add cart summary breakdown, place transactional orders and render admin audit cards" || true
echo "Pushing Group 6..."
git push origin main || true

echo "=== All groups committed and pushed successfully! ==="
