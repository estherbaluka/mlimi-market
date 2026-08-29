import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "../src/prisma/db";

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

async function upsertUser(email: string, name: string, role: "ADMIN" | "FARMER" | "BUYER", password: string) {
  const existing = await db.orm.public.User.where({ email }).select("id").all() as unknown as Array<{ id:number }>;
  if (existing[0]) return existing[0].id;
  const passwordHash = await hash(password);
  const created = await db.orm.public.User.create({ name, email, phone: null, passwordHash, role }) as unknown as { id:number };
  return created.id;
}

async function main() {
  console.log("Seeding...");

  const adminId = await upsertUser("admin@mlimi.test", "Admin", "ADMIN", "admin123");
  console.log("Admin:", adminId);

  const farmerId = await upsertUser("farmer@mlimi.test", "Example Farmer", "FARMER", "farmer123");
  // farmer profile
  try {
    const fps = await db.orm.public.FarmerProfile.where({ userId: farmerId }).select("id").all() as unknown as Array<{ id:number }>;
    if (!fps[0]) {
      await db.orm.public.FarmerProfile.create({ userId: farmerId, farmName: "Green Valley Farm", location: "Lilongwe", bio: "Family farm growing fresh produce since 2010." });
      console.log("Farmer profile created");
    }
  } catch (e) { console.error("farmer profile", e); }

  const buyerId = await upsertUser("buyer@mlimi.test", "Example Buyer", "BUYER", "buyer123");
  try {
    const bps = await db.orm.public.BuyerProfile.where({ userId: buyerId }).select("id").all() as unknown as Array<{ id:number }>;
    if (!bps[0]) {
      await db.orm.public.BuyerProfile.create({ userId: buyerId, defaultAddress: "Area 47", city: "Lilongwe", district: "Lilongwe" });
      console.log("Buyer profile created");
    }
  } catch (e) { console.error("buyer profile", e); }

  // Products - only if farmer has none
  const existingProducts = await db.orm.public.Product.where({ farmerId }).select("id").all() as unknown as Array<{ id:number }>;
  if (existingProducts.length > 0) {
    console.log(`Farmer already has ${existingProducts.length} products, skipping seed products`);
  } else {
    const products = [
      { title: "Fresh Tomatoes", description: "Juicy, vine-ripened tomatoes harvested this week.", category: "Vegetables", price: 2500, unit: "kg", stockQuantity: 100, image: "https://picsum.photos/seed/tomatoes/600/400" },
      { title: "Red Onions", description: "Aromatic red onions, perfect for stews.", category: "Vegetables", price: 1800, unit: "kg", stockQuantity: 80, image: "https://picsum.photos/seed/onions/600/400" },
      { title: "White Maize", description: "Premium white maize, dried and ready for milling.", category: "Grains", price: 1500, unit: "kg", stockQuantity: 200, image: "https://picsum.photos/seed/maize/600/400" },
      { title: "Cassava", description: "Fresh cassava tubers from Green Valley.", category: "Tubers", price: 1200, unit: "kg", stockQuantity: 60, image: "https://picsum.photos/seed/cassava/600/400" },
      { title: "Sweet Potatoes", description: "Sweet, orange-flesh sweet potatoes.", category: "Tubers", price: 1400, unit: "kg", stockQuantity: 70, image: "https://picsum.photos/seed/sweetpotato/600/400" },
      { title: "Bananas", description: "Ripe Cavendish bananas, bunch harvested daily.", category: "Fruits", price: 2000, unit: "bundle", stockQuantity: 40, image: "https://picsum.photos/seed/bananas/600/400" },
      { title: "Dry Beans", description: "Protein-rich dry beans, sorted and cleaned.", category: "Legumes", price: 3000, unit: "kg", stockQuantity: 50, image: "https://picsum.photos/seed/beans/600/400" },
      { title: "Groundnuts", description: "Roasted or raw groundnuts, farm-fresh.", category: "Legumes", price: 3500, unit: "kg", stockQuantity: 45, image: "https://picsum.photos/seed/groundnuts/600/400" },
      { title: "Farm Eggs", description: "Free-range eggs, dozen per tray.", category: "Poultry", price: 4500, unit: "dozen", stockQuantity: 30, image: "https://picsum.photos/seed/eggs/600/400" },
      { title: "Raw Honey", description: "Pure, unfiltered honey from our hives.", category: "Honey", price: 8000, unit: "litre", stockQuantity: 20, image: "https://picsum.photos/seed/honey/600/400" },
    ];

    for (const p of products) {
      const created = await db.orm.public.Product.create({
        farmerId,
        title: p.title,
        description: p.description,
        category: p.category,
        price: p.price,
        currency: "MWK",
        unit: p.unit,
        stockQuantity: p.stockQuantity,
        status: "ACTIVE",
      }) as unknown as { id:number };
      await db.orm.public.ProductImage.create({ productId: created.id, url: p.image, alt: p.title, isPrimary: true });
      console.log("Created product:", p.title);
    }
  }

  console.log("Seed done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
