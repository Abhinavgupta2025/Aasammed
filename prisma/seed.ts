import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding started...");

  // Clear existing data
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const sellerPasswordHash = await bcrypt.hash("seller123", 10);

  const admin = await prisma.user.create({
    data: {
      email: "admin@medchem.com",
      name: "Admin User",
      password: adminPasswordHash,
      role: "ADMIN",
    },
  });

  const seller = await prisma.user.create({
    data: {
      email: "seller@medchem.com",
      name: "Seller User",
      password: sellerPasswordHash,
      role: "USER",
    },
  });

  console.log(`Seeded users: admin (${admin.email}), seller (${seller.email})`);

  // Create Products
  const productsData = [
    {
      name: "Sodium Chloride",
      sku: "REA-NaCl-001",
      description: "Analytical grade Sodium Chloride, suitable for buffer preparation and general laboratory use.",
      category: "Reagents",
      baseUnit: "g" as const,
      basePricePaise: 50n, // ₹0.50 per g
      stockInBaseUnit: 5000.0,
      isActive: true,
    },
    {
      name: "Ethanol 99%",
      sku: "SOL-EtOH-99",
      description: "Absolute Ethanol 99.9%, pure chemistry grade solvent for analysis.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 120n, // ₹1.20 per mL
      stockInBaseUnit: 10000.0,
      isActive: true,
    },
    {
      name: "Hydrochloric Acid",
      sku: "SOL-HCl-37",
      description: "Hydrochloric Acid 37%, ACS Reagent grade, high concentration acidic solution.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 80n, // ₹0.80 per mL
      stockInBaseUnit: 3000.0,
      isActive: true,
    },
    {
      name: "Glucose",
      sku: "REA-GLU-500",
      description: "D-Glucose Anhydrous, high purity biological reagent grade dextrose.",
      category: "Reagents",
      baseUnit: "g" as const,
      basePricePaise: 200n, // ₹2.00 per g
      stockInBaseUnit: 2000.0,
      isActive: true,
    },
    {
      name: "Micropipette Tips",
      sku: "SUP-PIT-100",
      description: "Universal blue micropipette tips, 100-1000uL volume range, sterile pack.",
      category: "Lab Supplies",
      baseUnit: "unit" as const,
      basePricePaise: 500n, // ₹5.00 per unit
      stockInBaseUnit: 500.0,
      isActive: true,
    },
    {
      name: "Sodium Hydroxide Pellets",
      sku: "REA-NaOH-002",
      description: "Sodium Hydroxide Pellets, pure grade caustic soda for analytical work.",
      category: "Reagents",
      baseUnit: "g" as const,
      basePricePaise: 60n, // ₹0.60 per g
      stockInBaseUnit: 4000.0,
      isActive: true,
    },
    {
      name: "Acetone",
      sku: "SOL-ACT-001",
      description: "Acetone HPLC grade, solvent for chromatography and cleaning applications.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 150n, // ₹1.50 per mL
      stockInBaseUnit: 8000.0,
      isActive: true,
    },
    {
      name: "Methanol",
      sku: "SOL-MEOH-002",
      description: "Methanol anhydrous, solvent grade suitable for spectroscopy and chemical synthesis.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 110n, // ₹1.10 per mL
      stockInBaseUnit: 6000.0,
      isActive: true,
    },
    {
      name: "Whatman Filter Paper Grade 1",
      sku: "SUP-WFP-110",
      description: "Whatman qualitative filter paper, 110mm diameter circular sheets, pack of 100.",
      category: "Lab Supplies",
      baseUnit: "unit" as const,
      basePricePaise: 1500n, // ₹15.00 per unit
      stockInBaseUnit: 200.0,
      isActive: true,
    },
    {
      name: "Glass Beaker 250mL",
      sku: "SUP-GBK-250",
      description: "Borosilicate glass beaker, 250mL volume with graduation marks, thermal shock resistant.",
      category: "Lab Supplies",
      baseUnit: "unit" as const,
      basePricePaise: 12000n, // ₹120.00 per unit
      stockInBaseUnit: 50.0,
      isActive: true,
    },
    {
      name: "Potassium Permanganate",
      sku: "REA-KMnO4",
      description: "Potassium Permanganate crystal form, chemical reagent grade oxidizer.",
      category: "Reagents",
      baseUnit: "g" as const,
      basePricePaise: 350n, // ₹3.50 per g
      stockInBaseUnit: 1000.0,
      isActive: true,
    },
    {
      name: "Sulfuric Acid",
      sku: "SOL-H2SO4",
      description: "Concentrated Sulfuric Acid 98%, reagent grade dense chemical solution.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 250n, // ₹2.50 per mL
      stockInBaseUnit: 2500.0,
      isActive: true,
    },
    {
      name: "Nitric Acid",
      sku: "SOL-HNO3",
      description: "Nitric Acid 68%, reagent grade strong mineral acid.",
      category: "Solvents",
      baseUnit: "mL" as const,
      basePricePaise: 180n, // ₹1.80 per mL
      stockInBaseUnit: 4000.0,
      isActive: true,
    },
  ];

  for (const product of productsData) {
    const created = await prisma.product.create({
      data: product,
    });
    console.log(`Seeded product: ${created.name} (${created.sku})`);
  }

  console.log("Seeding completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error seeding database: ", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
