#!/usr/bin/env node

/**
 * Migration script to convert existing Conversation data to Channel data
 * This script should be run after updating the schema but before generating the Prisma client
 * 
 * NOTE: This is a one-time migration script for existing data.
 * If starting fresh, this script is not needed.
 */

const { PrismaClient } = require('@prisma/client');

async function migrateConversationsToChannels() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting migration from Conversations to Channels...');

    // Check if Conversation table exists (it might not if this is a fresh install)
    try {
      const conversationCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_name = 'conversations' AND table_schema = current_schema()
      `;
      
      if (conversationCount[0].count === '0') {
        console.log('No conversations table found - skipping migration (fresh install)');
        return;
      }
    } catch (error) {
      console.log('No conversations table found - skipping migration (fresh install)');
      return;
    }

    // Migrate conversations to channels
    const conversations = await prisma.$queryRaw`
      SELECT * FROM conversations WHERE "isActive" = true
    `;

    console.log(`Found ${conversations.length} conversations to migrate`);

    for (const conversation of conversations) {
      // Create corresponding DIRECT channel
      const channel = await prisma.channel.create({
        data: {
          id: conversation.id, // Keep same ID if possible
          name: null, // Direct messages have no name
          description: null,
          nscId: conversation.nscId,
          type: 'DIRECT',
          isActive: conversation.isActive,
          createdBy: conversation.createdBy,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt
        }
      });

      // Migrate conversation members to channel members
      const conversationMembers = await prisma.$queryRaw`
        SELECT * FROM conversation_members 
        WHERE "conversationId" = ${conversation.id} AND "isActive" = true
      `;

      for (const member of conversationMembers) {
        await prisma.channelMember.create({
          data: {
            channelId: channel.id,
            userId: member.userId,
            joinedAt: member.joinedAt,
            isActive: member.isActive
          }
        });
      }

      console.log(`Migrated conversation ${conversation.id} to channel`);
    }

    // Update existing messages to reference channels instead of conversations
    const messagesToUpdate = await prisma.$queryRaw`
      SELECT id, "conversationId" FROM messages WHERE "conversationId" IS NOT NULL
    `;

    console.log(`Updating ${messagesToUpdate.length} messages...`);

    for (const message of messagesToUpdate) {
      await prisma.$queryRaw`
        UPDATE messages 
        SET "channelId" = ${message.conversationId}, "conversationId" = NULL 
        WHERE id = ${message.id}
      `;
    }

    console.log('Migration completed successfully!');
    console.log('You can now safely drop the old conversation tables:');
    console.log('- conversations');
    console.log('- conversation_members');

  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateConversationsToChannels()
    .then(() => {
      console.log('Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateConversationsToChannels };
