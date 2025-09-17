const { PrismaClient } = require('@prisma/client');

class DatabaseService {
  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      errorFormat: 'pretty',
    });
  }

  async connect() {
    try {
      await this.prisma.$connect();
      console.log('✅ Database connected successfully');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      console.log('✅ Database disconnected successfully');
    } catch (error) {
      console.error('❌ Database disconnection failed:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'healthy', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
    }
  }

  // Multi-tenant query helpers
  async findUserWithNSCAccess(userId, nscId) {
    return this.prisma.user.findFirst({
      where: {
        id: userId,
        nscMemberships: {
          some: {
            nscId,
            isActive: true
          }
        }
      },
      include: {
        nscMemberships: {
          where: { nscId, isActive: true },
          include: {
            nsc: true,
            role: true
          }
        }
      }
    });
  }

  async findChannelsForUser(userId, nscId) {
    return this.prisma.channel.findMany({
      where: {
        nscId,
        OR: [
          { type: 'PUBLIC' },
          {
            members: {
              some: {
                userId,
                isActive: true
              }
            }
          }
        ],
        isActive: true
      },
      include: {
        members: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        _count: {
          select: {
            messages: true,
            members: true
          }
        }
      }
    });
  }
}

const dbService = new DatabaseService();

module.exports = { dbService, prisma: dbService.prisma };
