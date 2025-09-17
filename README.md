# ConnectHub - Internal Communication Platform

A secure, multi-tenant internal communication platform designed for NSCs (National Service Centers) in the APAC region. This backend provides a Slack-like experience with enterprise-grade security and multi-tenant architecture.

## 🚀 Features

### Core Features (MVP)
- **Multi-Tenant Architecture**: Each NSC operates as an isolated tenant
- **Dual Authentication**: Windows SSO and form-based authentication
- **Role-Based Access Control**: Flexible permission system
- **Channel Management**: Public, private, and direct messaging
- **Real-time Messaging**: Secure chat with message history
- **User Management**: Search, invite, and manage users across NSCs
- **Admin Dashboard**: Comprehensive administration tools

### Security Features
- JWT-based authentication with refresh tokens
- Rate limiting and DDoS protection
- Input validation and sanitization
- CORS configuration
- Security headers
- Audit logging
- Encrypted data storage

### Future Enhancements
- Real-time messaging with Socket.IO
- AI chatbot integration
- Video/audio calling
- File sharing and uploads
- Multilingual support (i18n)
- Push notifications
- Mobile app API

## 🛠 Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT with Passport.js
- **Security**: Rate limiting, validation, encryption
- **API**: RESTful with comprehensive error handling

## 📋 Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## 🚀 Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ConnectHub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and configuration
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:3000`

## 📁 Project Structure

```
ConnectHub/
├── src/
│   ├── server.js              # Main server entry point
│   ├── routes/                # API route handlers
│   │   ├── auth.js           # Authentication routes
│   │   ├── users.js          # User management
│   │   ├── nsc.js            # NSC management
│   │   ├── channels.js       # Channel operations
│   │   ├── messages.js       # Messaging
│   │   └── roles.js          # Role management
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # Authentication middleware
│   │   ├── security.js      # Security headers
│   │   ├── rateLimiter.js   # Rate limiting
│   │   ├── errorHandler.js  # Error handling
│   │   └── logger.js        # Request logging
│   ├── config/              # Configuration files
│   │   └── database.js      # Database configuration
│   ├── services/            # Business logic services
│   └── utils/               # Utility functions
├── prisma/
│   └── schema.prisma        # Database schema
├── .env                     # Environment variables
├── package.json
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/connecthub"

# Server
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Security
BCRYPT_ROUNDS=12
```

### Database Setup

1. Create a PostgreSQL database
2. Update the `DATABASE_URL` in your `.env` file
3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

## 📖 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "johndoe",
  "firstName": "John",
  "lastName": "Doe",
  "password": "SecurePassword123!",
  "nscId": "uuid-of-nsc"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

### NSC Management

#### Get User's NSCs
```http
GET /api/nsc
Authorization: Bearer <jwt-token>
```

#### Create NSC
```http
POST /api/nsc
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "NSC Singapore",
  "region": "APAC",
  "subdomain": "sg"
}
```

### Channel Management

#### Get Channels
```http
GET /api/channels/:nscId
Authorization: Bearer <jwt-token>
```

#### Create Channel
```http
POST /api/channels/:nscId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "general",
  "description": "General discussion",
  "type": "PUBLIC"
}
```

### Messaging

#### Get Messages
```http
GET /api/messages/:nscId/:channelId?limit=50&offset=0
Authorization: Bearer <jwt-token>
```

#### Send Message
```http
POST /api/messages/:nscId/:channelId
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "content": "Hello, world!",
  "type": "TEXT"
}
```

## 🔐 Security

### Authentication Flow
1. User registers or logs in with credentials
2. Server validates credentials and returns JWT token
3. Client includes token in Authorization header for subsequent requests
4. Server validates token and extracts user information
5. Middleware checks user permissions for requested resources

### Multi-Tenant Security
- Each NSC operates in isolation
- Users can belong to multiple NSCs with different roles
- Database queries are automatically scoped to the user's accessible NSCs
- Cross-tenant data access is prevented at the application level

### Rate Limiting
- General API: 100 requests per 15 minutes
- Authentication: 5 attempts per 15 minutes
- Configurable limits per endpoint

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run tests in watch mode
npm run test:watch

# Generate test coverage
npm run test:coverage
```

## 📊 Database Schema

The application uses a multi-tenant architecture with the following key entities:

- **NSC**: National Service Centers (tenants)
- **User**: Users who can belong to multiple NSCs
- **UserNSC**: Junction table for user-NSC relationships with roles
- **Role**: Role definitions with permissions per NSC
- **Channel**: Communication channels within NSCs
- **Message**: Messages within channels
- **Invitation**: External user invitations

## 🔧 Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with hot reload
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Prisma Studio

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation in the `docs/` folder

## 🗺 Roadmap

### Phase 1 (MVP) ✅
- [x] Multi-tenant architecture
- [x] Authentication system
- [x] Role-based access control
- [x] Channel management
- [x] Basic messaging
- [x] User management

### Phase 2 (Enhanced Features)
- [ ] Real-time messaging with WebSocket
- [ ] File upload and sharing
- [ ] Message threading
- [ ] Emoji reactions
- [ ] Message search
- [ ] Notification system

### Phase 3 (Advanced Features)
- [ ] Video/audio calling
- [ ] AI chatbot integration
- [ ] Analytics dashboard
- [ ] Mobile app support
- [ ] Third-party integrations
- [ ] Advanced security features
