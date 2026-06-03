# MedChem Inventory

**MedChem Inventory** is a premium, full-stack inventory and order management system designed for chemical laboratories and pharmaceutical inventory handlers. It offers a role-aware dashboard for administrators and sellers, featuring unit-conversion-aware order requests, live pricing calculation, transactional database stock verification, and low-stock alerts.

---

## Tech Stack

- **Frontend & Routing:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS (Dark theme slate palette)
- **Database ORM:** Prisma ORM
- **Database:** Neon PostgreSQL (Serverless)
- **Authentication:** NextAuth.js (Credentials Provider)
- **State Management & Actions:** React Hooks, local-storage-backed shopping cart, and transaction-safe API endpoints
- **Notifications:** React Hot Toast

---

## Unit Storage Strategy

To avoid mathematical discrepancies and facilitate standardized inventory records, all chemical quantities are converted into their respective product **base units** before being committed to the database.

- **`lib/units.ts`** exports pure conversion helpers:
  - `convertToBase`: Converts values from selected ordering units to base units before database writes.
  - `convertFromBase`: Formats values from base units back to display units in the UI.
  - `getCompatibleUnits`: Determines compatible units based on metric compatibility groups (Mass: `g` $\leftrightarrow$ `kg`, Volume: `mL` $\leftrightarrow$ `L`, Unit: `unit`).
  - `calculateLineTotal`: Performs server-side validation of line item totals.

### Conversion Factor Table

The system defines the following conversion ratios to the base unit:

| Base Unit | Input Unit | Conversion Multiplier (to Base) | Formula / Example |
| :--- | :--- | :--- | :--- |
| **g** (Grams) | `g` | 1 | $1 \text{ g} = 1 \text{ g}$ |
| | `kg` | 1,000 | $2 \text{ kg} \rightarrow 2,000 \text{ g}$ |
| **kg** (Kilograms) | `kg` | 1 | $1 \text{ kg} = 1 \text{ kg}$ |
| | `g` | 0.001 | $500 \text{ g} \rightarrow 0.5 \text{ kg}$ |
| **L** (Liters) | `L` | 1 | $1 \text{ L} = 1 \text{ L}$ |
| | `mL` | 0.001 | $500 \text{ mL} \rightarrow 0.5 \text{ L}$ |
| **mL** (Milliliters) | `mL` | 1 | $1 \text{ mL} = 1 \text{ mL}$ |
| | `L` | 1,000 | $2 \text{ L} \rightarrow 2,000 \text{ mL}$ |
| **unit** (Count) | `unit` | 1 | $1 \text{ unit} = 1 \text{ unit}$ |

---

## Price Storage Strategy (Why BIGINT?)

All monetary values are stored in the database as integer **paise** (1 Rupee = 100 paise) using the PostgreSQL `BIGINT` (BigInt in JS) type.

### The Float Problem
Floating-point representations (IEEE 754 standard) are inherently imprecise when performing decimal arithmetic. For example, evaluating `0.1 + 0.2` in standard Javascript results in `0.30000000000000004`. Over thousands of inventory items and orders, these rounding discrepancies accumulate into significant financial audit mismatches.

### The Integer Solution
By multiplying all currency inputs by 100 and converting them into integers (paise), the system completely bypasses decimal rounding issues. BigInt arithmetic handles large transaction amounts safely without losing precision. Display formatting is resolved on the UI layer using `Intl.NumberFormat('en-IN')` to display Rupees in the standard Indian number format:
`₹X,XX,XXX.XX` (e.g. `150000` paise $\rightarrow$ `₹1,500.00`).

---

## Test Credentials

We have seeded two administrative and seller demonstration accounts:

- **Admin Account (Administrator Control):**
  - **Email:** `admin@medchem.com`
  - **Password:** `admin123`
  - **Permissions:** Full product CRUD, order approval/rejections, low-stock dashboard review.
- **Seller Account (User Catalog & Checkout):**
  - **Email:** `seller@medchem.com`
  - **Password:** `seller123`
  - **Permissions:** Search/filter catalog, live product configuration, cart management, order requests checkout.

---

## How to Run Locally

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org) (v18+ recommended) and `npm` installed.

### 2. Clone and Install Dependencies
Navigate to the project root and install the dependencies:
```bash
npm install
```

### 3. Setup Environment Variables
Create a local `.env` file at the root of the project (copying `.env.example`):
```env
DATABASE_URL="postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET="your-random-32-character-secret-signing-key"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Neon Cloud Database
1. Go to [Neon Console](https://neon.tech) and create a free project.
2. Copy the connection string.
3. Replace the `DATABASE_URL` in `.env` with your Neon connection string (appending `?sslmode=require` if it's not present).

### 5. Run Database Migrations
Generate Prisma clients and push schema structures to the database:
```bash
npx prisma generate
npx prisma migrate dev --name init
```

### 6. Seed the Database
Run the seed script to create test accounts and initial chemical products:
```bash
npx prisma db seed
```

### 7. Run the Development Server
Launch the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.


---

## Vercel Deployment Steps

1. Push your local project repository to GitHub, GitLab, or Bitbucket.
2. Log in to the [Vercel Dashboard](https://vercel.com) and click **Add New > Project**.
3. Import your repository.
4. Expand the **Environment Variables** section and configure:
   - `DATABASE_URL`: Your pooled Neon connection string (Vercel works best with pooled connections).
   - `NEXTAUTH_SECRET`: A secure random secret string.
   - `NEXTAUTH_URL`: Your Vercel deployment production domain (e.g., `https://your-app.vercel.app`).
5. Ensure the **Build Command** is set to:
   - `next build`
6. Click **Deploy**. Vercel will build the Next.js App Router static pages and API routes and connect them directly to Neon PostgreSQL.

---

## Walkthrough of Features

### 1. Credentials Authentication (`/login`)
A secure card interface validating passwords against the database. Shows test credentials for quick review.

### 2. Seller Catalog & Details (`/dashboard`)
- **Overview:** Displays quick KPI metrics of purchase history and a table of the 5 most recent orders.
- **Searchable Catalog:** Dynamic search bar and select dropdown filters allow sellers to filter items by keyword, category, or base storage units.
- **Unit Selector & Live Price Preview:** In the product details page, sellers can choose between compatible units (e.g. Grams vs Kilograms). Typing a quantity instantly updates a live preview: `2 kg × ₹150.00/g = ₹300,000.00`, giving immediate cost awareness.

### 3. Order Checkout (`/dashboard/cart` & `/dashboard/orders`)
- **Shopping Cart:** Allows sellers to change item quantities or swap measurement units inline. Shows total rupee calculations before submitting.
- **Order History:** Lists placed orders labeled with status badges: `PENDING`, `CONFIRMED`, or `REJECTED`.

### 4. Admin Portal (`/admin`)
- **Overview Metrics:** Lists total system products, pending order approvals, and total accumulated sales revenue.
- **Manage Products CRUD:** Form modals allow administrators to create, edit, or delete chemical items. Prices are entered in standard Rupees and saved as paise. Deleting is protected to avoid breaking historical logs.
- **Order Approval Panel:** Lists all placed orders. Clicking an order expands it to show the items, quantities, and user notes. Admins can click **Approve Request** or **Reject Order** (which automatically restores the reserved product stock).
- **Stock Warnings:** Dynamic warning indicators list all chemicals whose stock levels have dropped below 100 base units.
