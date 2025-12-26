import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Comprehensive Inventory Type Taxonomy Seed Script
 * 35 Types in 6 Categories as per Complete System Brief.pdf
 */

const inventoryTypeTaxonomy = [
  // 1. Source Inventory Types (2)
  {
    name: 'Clones',
    description: 'Cannabis plant clones',
    category: 'Source',
    unit: 'units',
    isSource: true,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Seeds',
    description: 'Cannabis seeds',
    category: 'Source',
    unit: 'units',
    isSource: true,
    isWaste: false,
    canConvert: true,
  },

  // 2. Waste Inventory Type (1)
  {
    name: 'Waste',
    description: 'Waste material - logging only, must be destroyed',
    category: 'Waste',
    unit: 'grams',
    isSource: false,
    isWaste: true,
    canConvert: false, // Cannot be converted
  },

  // 3. Wet Inventory Types - From Harvest (5)
  {
    name: 'Wet Flower',
    description: 'Freshly harvested whole flower (wet weight)',
    category: 'Wet',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Wet Trim',
    description: 'Fresh trim from harvest (leaves/sugar trim)',
    category: 'Wet',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Wet Whole Plant',
    description: 'Whole plant wet biomass (includes stems)',
    category: 'Wet',
    unit: 'kg',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Fresh Frozen Flower',
    description: 'Immediately frozen flower for extraction',
    category: 'Wet',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Fresh Frozen Trim',
    description: 'Trim frozen post-harvest for extraction',
    category: 'Wet',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },

  // 4. Dry Inventory Types - From Cure (5)
  {
    name: 'Dry Flower (Cured)',
    description: 'Dried and cured flower ready for inventory/lots',
    category: 'Dry',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Dry Trim',
    description: 'Dried trim separated from cured flower (for extracts)',
    category: 'Dry',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Cured Whole Plant',
    description: 'Cured whole-plant biomass (rare)',
    category: 'Dry',
    unit: 'kg',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Bucked Flower',
    description: 'Flower removed from stems and cured',
    category: 'Dry',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Smalls/Shake',
    description: 'Loose cured flower pieces and shake',
    category: 'Dry',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },

  // 5. Lot Inventory Types - From "Create Lot" (3)
  {
    name: 'Lot of Wet Flower',
    description: 'A batch of freshly harvested cannabis flower that has not yet been dried or cured',
    category: 'Lot',
    unit: 'lbs',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Lot of Dry Flower',
    description: 'A batch of cannabis flower that has been dried and cured, ready for further processing or sale',
    category: 'Lot',
    unit: 'lbs',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Lot of Trim',
    description: 'A batch of cannabis trim material',
    category: 'Lot',
    unit: 'lbs',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },

  // 6. Extraction Inventory Types - From Conversion (10)
  {
    name: 'Crude Extract (Solvent)',
    description: 'Initial solvent-based extraction (unrefined)',
    category: 'Extraction',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Distillate',
    description: 'Highly refined THC/CBD distillate',
    category: 'Extraction',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Winterized Oil',
    description: 'Extract that has been winterized to remove fats/waxes',
    category: 'Extraction',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Full-Spectrum Extract',
    description: 'Extract containing full cannabinoid and terpene profile',
    category: 'Extraction',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Live Resin',
    description: 'Extract from fresh frozen flower',
    category: 'Extraction',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Rosin',
    description: 'Solventless extract from heat and pressure',
    category: 'Extraction',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Hash/Kief',
    description: 'Concentrated trichomes (dry sift or ice water hash)',
    category: 'Extraction',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Isolate (THC/CBD)',
    description: 'Pure crystalline cannabinoid isolate',
    category: 'Extraction',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'Resin Sauce/Hybrid Concentrate',
    description: 'THCA crystals in terpene-rich sauce',
    category: 'Extraction',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },
  {
    name: 'RSO/Full Extract Oil',
    description: 'Rick Simpson Oil or full extract cannabis oil',
    category: 'Extraction',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: true,
  },

  // 7. Finished Goods - From Conversion (15)
  {
    name: 'Pre-Rolls',
    description: 'Pre-rolled cannabis cigarettes',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false, // Final product
  },
  {
    name: 'Edibles (Gummies)',
    description: 'Cannabis-infused gummy edibles',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Edibles (Baked Goods)',
    description: 'Cannabis-infused baked goods',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Tinctures',
    description: 'Liquid cannabis extracts in dropper bottles',
    category: 'FinishedGoods',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Topicals (Creams/Lotions)',
    description: 'Cannabis-infused topical products',
    category: 'FinishedGoods',
    unit: 'oz',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Capsules',
    description: 'Cannabis oil capsules',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Vape Cartridges',
    description: 'Pre-filled vape cartridges',
    category: 'FinishedGoods',
    unit: 'ml',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Beverages',
    description: 'Cannabis-infused beverages',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Concentrate Pens',
    description: 'Disposable concentrate vape pens',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Transdermal Patches',
    description: 'Cannabis transdermal patches',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Suppositories',
    description: 'Cannabis suppositories',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Infused Chocolates',
    description: 'Cannabis-infused chocolates',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Infused Mints',
    description: 'Cannabis-infused mints',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Sublingual Strips',
    description: 'Fast-dissolving sublingual strips',
    category: 'FinishedGoods',
    unit: 'each',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
  {
    name: 'Flower Packaging (Ready for Sale)',
    description: 'Packaged flower ready for retail sale',
    category: 'FinishedGoods',
    unit: 'grams',
    isSource: false,
    isWaste: false,
    canConvert: false,
  },
];

async function seedInventoryTypes() {
  console.log('🌱 Seeding comprehensive inventory type taxonomy...');
  console.log(`📦 Total types to seed: ${inventoryTypeTaxonomy.length}`);

  // First, delete old inventory types (optional - comment out to preserve)
  // await prisma.inventoryType.deleteMany({});
  
  let createdCount = 0;
  let updatedCount = 0;

  for (const type of inventoryTypeTaxonomy) {
    const result = await prisma.inventoryType.upsert({
      where: { name: type.name },
      update: {
        description: type.description,
        category: type.category,
        unit: type.unit,
        isSource: type.isSource,
        isWaste: type.isWaste,
        canConvert: type.canConvert,
        isActive: true,
        updatedAt: new Date(),
      },
      create: {
        name: type.name,
        description: type.description,
        category: type.category,
        unit: type.unit,
        isSource: type.isSource,
        isWaste: type.isWaste,
        canConvert: type.canConvert,
        isActive: true,
      },
    });

    if (result.createdAt.getTime() === result.updatedAt.getTime()) {
      createdCount++;
    } else {
      updatedCount++;
    }
  }

  console.log(`✅ Inventory types seeded successfully!`);
  console.log(`   - Created: ${createdCount}`);
  console.log(`   - Updated: ${updatedCount}`);
  console.log(`   - Total: ${inventoryTypeTaxonomy.length}`);
  
  // Display summary by category
  const categories = ['Source', 'Waste', 'Wet', 'Dry', 'Lot', 'Extraction', 'FinishedGoods'];
  console.log('\n📊 Breakdown by category:');
  for (const cat of categories) {
    const count = inventoryTypeTaxonomy.filter(t => t.category === cat).length;
    console.log(`   - ${cat}: ${count} types`);
  }
}

async function seedLicenseTypes() {
  console.log('\n🏢 Seeding license types...');
  
  const licenseTypes = [
    { name: 'Cultivator', description: 'Licensed cannabis cultivation facility', canTransfer: true },
    { name: 'Manufacturer', description: 'Licensed cannabis manufacturing/processing facility', canTransfer: true },
    { name: 'Retail', description: 'Licensed retail dispensary', canTransfer: true },
    { name: 'Lab', description: 'Licensed testing laboratory', canTransfer: false },
    { name: 'Transporter', description: 'Licensed cannabis transporter', canTransfer: true },
    { name: 'Distributor', description: 'Licensed cannabis distributor', canTransfer: true },
  ];

  for (const licType of licenseTypes) {
    await prisma.licenseType.upsert({
      where: { name: licType.name },
      update: {
        description: licType.description,
        canTransfer: licType.canTransfer,
        updatedAt: new Date(),
      },
      create: {
        name: licType.name,
        description: licType.description,
        canTransfer: licType.canTransfer,
      },
    });
  }

  console.log(`✅ Seeded ${licenseTypes.length} license types`);
}

async function main() {
  try {
    await seedInventoryTypes();
    await seedLicenseTypes();
    
    console.log('\n🎉 Phase 1 seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
