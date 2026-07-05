const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const GROCERY_IMAGES = [
  'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1584308666744-24d5e4a77918?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1607349913338-fca6f7fc42d0?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1604719312566-8fa20f1882ce?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1588964895597-cfccd6e2dbf9?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1628102491629-77858ab5721d?auto=format&fit=crop&q=80&w=300',
  'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=300'
];

async function main() {
  const products = await prisma.product.findMany();
  let updatedCount = 0;

  for (const product of products) {
    if (product.imageUrl && product.imageUrl.includes('bigbasket.com/pd/')) {
      const randomImage = GROCERY_IMAGES[Math.floor(Math.random() * GROCERY_IMAGES.length)];
      await prisma.product.update({
        where: { id: product.id },
        data: { imageUrl: randomImage }
      });
      updatedCount++;
    }
  }
  console.log(`Updated ${updatedCount} products with valid images.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
