import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create sample users
  const adminPassword = await bcrypt.hash("admin123", 12);
  const userPassword = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@vehicleguard.uk" },
    update: {},
    create: {
      email: "admin@vehicleguard.uk",
      name: "Admin User",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      name: "Demo User",
      password: userPassword,
      role: "USER",
    },
  });

  console.log(`Created users: ${admin.email}, ${demoUser.email}`);

  // Create sample service intervals
  const intervals = [
    { make: "Ford", model: "Fiesta", intervalMiles: 12500, intervalMonths: 12 },
    { make: "Ford", model: "Focus", intervalMiles: 12500, intervalMonths: 12 },
    { make: "Vauxhall", model: "Corsa", intervalMiles: 20000, intervalMonths: 12 },
    { make: "Volkswagen", model: "Golf", intervalMiles: 10000, intervalMonths: 12 },
    { make: "BMW", model: "3 Series", intervalMiles: 18000, intervalMonths: 24 },
    { make: "Audi", model: "A3", intervalMiles: 19000, intervalMonths: 24 },
    { make: "Toyota", model: "Yaris", intervalMiles: 10000, intervalMonths: 12 },
    { make: "Honda", model: "Civic", intervalMiles: 12500, intervalMonths: 12 },
    { make: "Nissan", model: "Qashqai", intervalMiles: 9000, intervalMonths: 12 },
    { make: "Mercedes", model: "A-Class", intervalMiles: 15500, intervalMonths: 12 },
  ];

  for (const interval of intervals) {
    await prisma.serviceInterval.upsert({
      where: {
        make_model_variant: {
          make: interval.make,
          model: interval.model,
          variant: "",
        },
      },
      update: {},
      create: {
        make: interval.make,
        model: interval.model,
        intervalMiles: interval.intervalMiles,
        intervalMonths: interval.intervalMonths,
      },
    });
  }

  console.log(`Created ${intervals.length} service intervals`);

  console.log("Seed completed successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
