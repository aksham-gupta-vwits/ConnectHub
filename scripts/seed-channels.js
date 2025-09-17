const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedChannels() {
  try {
    console.log('Seeding default channels...');

    // Get all NSCs
    const nscs = await prisma.nSC.findMany({
      where: { isActive: true }
    });

    for (const nsc of nscs) {
      console.log(`Creating default channels for NSC: ${nsc.name}`);

      // Check if general channel already exists
      const existingGeneral = await prisma.channel.findFirst({
        where: {
          name: 'general',
          nscId: nsc.id,
          isActive: true
        }
      });

      if (!existingGeneral) {
        // Create general channel
        const generalChannel = await prisma.channel.create({
          data: {
            name: 'general',
            description: 'General discussion for all team members',
            nscId: nsc.id,
            type: 'PUBLIC',
            createdBy: 'system' // You might want to use an actual admin user ID
          }
        });

        // Add all NSC members to general channel
        const nscMembers = await prisma.userNSC.findMany({
          where: {
            nscId: nsc.id,
            isActive: true
          }
        });

        if (nscMembers.length > 0) {
          await prisma.channelMember.createMany({
            data: nscMembers.map(member => ({
              channelId: generalChannel.id,
              userId: member.userId
            }))
          });
        }

        console.log(`Created general channel for ${nsc.name}`);
      } else {
        console.log(`General channel already exists for ${nsc.name}`);
      }

      // Create announcements channel if it doesn't exist
      const existingAnnouncements = await prisma.channel.findFirst({
        where: {
          name: 'announcements',
          nscId: nsc.id,
          isActive: true
        }
      });

      if (!existingAnnouncements) {
        const announcementsChannel = await prisma.channel.create({
          data: {
            name: 'announcements',
            description: 'Important announcements and updates',
            nscId: nsc.id,
            type: 'PUBLIC',
            createdBy: 'system'
          }
        });

        // Add all NSC members to announcements channel
        const nscMembers = await prisma.userNSC.findMany({
          where: {
            nscId: nsc.id,
            isActive: true
          }
        });

        if (nscMembers.length > 0) {
          await prisma.channelMember.createMany({
            data: nscMembers.map(member => ({
              channelId: announcementsChannel.id,
              userId: member.userId
            }))
          });
        }

        console.log(`Created announcements channel for ${nsc.name}`);
      } else {
        console.log(`Announcements channel already exists for ${nsc.name}`);
      }
    }

    console.log('Channel seeding completed!');

  } catch (error) {
    console.error('Error seeding channels:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedChannels();
  } catch (error) {
    console.error('Seed script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { seedChannels };
