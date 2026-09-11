import { prisma } from '../../../../packages/database/src/index';

/**
 * Script pour promouvoir un utilisateur existant en administrateur
 * Usage: npx ts-node src/scripts/createAdmin.ts <email>
 */
async function createAdmin(email: string) {
  try {
    console.log(`🔍 Recherche de l'utilisateur avec l'email: ${email}`);
    
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      console.error(`❌ Utilisateur non trouvé avec l'email: ${email}`);
      process.exit(1);
    }

    console.log(`👤 Utilisateur trouvé: ${user.firstName} ${user.lastName} (${user.role})`);

    if (user.role === 'ADMIN') {
      console.log(`✅ Cet utilisateur est déjà administrateur`);
      process.exit(0);
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' }
    });

    console.log(`✅ Utilisateur promu avec succès en administrateur !`);
    console.log(`📧 Email: ${updatedUser.email}`);
    console.log(`👤 Nom: ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`🔐 Nouveau rôle: ${updatedUser.role}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Récupérer l'email depuis les arguments de ligne de commande
const email = process.argv[2];

if (!email) {
  console.error('❌ Usage: npx ts-node src/scripts/createAdmin.ts <email>');
  console.error('📝 Exemple: npx ts-node src/scripts/createAdmin.ts admin@example.com');
  process.exit(1);
}

createAdmin(email);