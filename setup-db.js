#!/usr/bin/env node

// Database setup and seeding script for ConnectHub
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const createSampleData = async () => {
  console.log('🌱 Seeding database with sample data...\n');

  try {
    // Create sample NSCs
    console.log('Creating NSCs...');
    const nscSingapore = await prisma.nSC.create({
      data: {
        name: 'NSC Singapore',
        region: 'APAC',
        subdomain: 'sg'
      }
    });

    const nscMalaysia = await prisma.nSC.create({
      data: {
        name: 'NSC Malaysia',
        region: 'APAC',
        subdomain: 'my'
      }
    });

    console.log(`✅ Created NSCs: ${nscSingapore.name}, ${nscMalaysia.name}`);

    // Create default roles for each NSC
    console.log('\nCreating roles...');
    const adminRoleSG = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full administrative access',
        nscId: nscSingapore.id,
        permissions: [
          'admin',
          'manage_users',
          'manage_channels',
          'manage_roles',
          'read_channels',
          'send_messages',
          'join_public_channels',
          'create_channels',
          'delete_messages',
          'invite_users'
        ]
      }
    });

    const memberRoleSG = await prisma.role.create({
      data: {
        name: 'Member',
        description: 'Default member access',
        nscId: nscSingapore.id,
        permissions: [
          'read_channels',
          'send_messages',
          'join_public_channels'
        ]
      }
    });

    const adminRoleMY = await prisma.role.create({
      data: {
        name: 'Admin',
        description: 'Full administrative access',
        nscId: nscMalaysia.id,
        permissions: [
          'admin',
          'manage_users',
          'manage_channels',
          'manage_roles',
          'read_channels',
          'send_messages',
          'join_public_channels',
          'create_channels',
          'delete_messages',
          'invite_users'
        ]
      }
    });

    const memberRoleMY = await prisma.role.create({
      data: {
        name: 'Member',
        description: 'Default member access',
        nscId: nscMalaysia.id,
        permissions: [
          'read_channels',
          'send_messages',
          'join_public_channels'
        ]
      }
    });

    console.log('✅ Created roles for both NSCs');

    // Create sample users
    console.log('\nCreating users...');
    const passwordHash = await bcrypt.hash('Password123!', 12);

    const admin1 = await prisma.user.create({
      data: {
        email: 'admin@singapore.nsc',
        username: 'admin_sg',
        firstName: 'John',
        lastName: 'Admin',
        passwordHash,
        authProvider: 'form'
      }
    });

    const user1 = await prisma.user.create({
      data: {
        email: 'user1@singapore.nsc',
        username: 'user1_sg',
        firstName: 'Alice',
        lastName: 'Smith',
        passwordHash,
        authProvider: 'form'
      }
    });

    const user2 = await prisma.user.create({
      data: {
        email: 'user2@malaysia.nsc',
        username: 'user2_my',
        firstName: 'Bob',
        lastName: 'Johnson',
        passwordHash,
        authProvider: 'form'
      }
    });

    console.log('✅ Created sample users');

    // Create NSC memberships
    console.log('\nCreating NSC memberships...');
    await prisma.userNSC.create({
      data: {
        userId: admin1.id,
        nscId: nscSingapore.id,
        roleId: adminRoleSG.id
      }
    });

    await prisma.userNSC.create({
      data: {
        userId: user1.id,
        nscId: nscSingapore.id,
        roleId: memberRoleSG.id
      }
    });

    await prisma.userNSC.create({
      data: {
        userId: user2.id,
        nscId: nscMalaysia.id,
        roleId: memberRoleMY.id
      }
    });

    // Create cross-NSC membership for admin
    await prisma.userNSC.create({
      data: {
        userId: admin1.id,
        nscId: nscMalaysia.id,
        roleId: adminRoleMY.id
      }
    });

    console.log('✅ Created NSC memberships');

    // Create sample channels
    console.log('\nCreating channels...');
    const generalSG = await prisma.channel.create({
      data: {
        name: 'general',
        description: 'General discussion for Singapore NSC',
        nscId: nscSingapore.id,
        type: 'PUBLIC',
        createdBy: admin1.id
      }
    });

    const techSG = await prisma.channel.create({
      data: {
        name: 'tech-updates',
        description: 'Technology updates and discussions',
        nscId: nscSingapore.id,
        type: 'PUBLIC',
        createdBy: admin1.id
      }
    });

    const generalMY = await prisma.channel.create({
      data: {
        name: 'general',
        description: 'General discussion for Malaysia NSC',
        nscId: nscMalaysia.id,
        type: 'PUBLIC',
        createdBy: admin1.id
      }
    });

    console.log('✅ Created sample channels');

    // Add users to channels
    console.log('\nAdding users to channels...');
    await prisma.channelMember.createMany({
      data: [
        { channelId: generalSG.id, userId: admin1.id },
        { channelId: generalSG.id, userId: user1.id },
        { channelId: techSG.id, userId: admin1.id },
        { channelId: techSG.id, userId: user1.id },
        { channelId: generalMY.id, userId: admin1.id },
        { channelId: generalMY.id, userId: user2.id }
      ]
    });

    console.log('✅ Added users to channels');

    // Create sample messages
    console.log('\nCreating sample messages...');
    await prisma.message.createMany({
      data: [
        {
          content: 'Welcome to ConnectHub Singapore! 🇸🇬',
          channelId: generalSG.id,
          senderId: admin1.id,
          type: 'TEXT'
        },
        {
          content: 'Hello everyone! Excited to be here.',
          channelId: generalSG.id,
          senderId: user1.id,
          type: 'TEXT'
        },
        {
          content: 'Check out the latest tech updates in this channel.',
          channelId: techSG.id,
          senderId: admin1.id,
          type: 'TEXT'
        },
        {
          content: 'Welcome to ConnectHub Malaysia! 🇲🇾',
          channelId: generalMY.id,
          senderId: admin1.id,
          type: 'TEXT'
        },
        {
          content: 'Thanks for the warm welcome!',
          channelId: generalMY.id,
          senderId: user2.id,
          type: 'TEXT'
        }
      ]
    });

    console.log('✅ Created sample messages');

    console.log('\n🎉 Database seeded successfully!');
    console.log('\n📋 Sample Accounts:');
    console.log('   Admin (Multi-NSC): admin@singapore.nsc / Password123!');
    console.log('   User Singapore: user1@singapore.nsc / Password123!');
    console.log('   User Malaysia: user2@malaysia.nsc / Password123!');
    console.log('\n🏢 NSCs Created:');
    console.log('   - NSC Singapore (subdomain: sg)');
    console.log('   - NSC Malaysia (subdomain: my)');
    console.log('\n📝 API Test Commands:');
    console.log('   npm run test:endpoints');
    console.log('   curl http://localhost:3000/health');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 ConnectHub Database Setup');
    console.log('============================\n');

    // Check if database is empty
    const userCount = await prisma.user.count();
    if (userCount > 0) {
      console.log('⚠️  Database already contains data.');
      console.log('   To reset and seed, please run: npx prisma db push --force-reset');
      return;
    }

    await createSampleData();

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
};

main();
