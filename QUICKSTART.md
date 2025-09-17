# ConnectHub - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js (v14+)
- PostgreSQL (v12+)
- Git

### Step 1: Setup Database
1. Create a PostgreSQL database named `connecthub`
2. Update the `.env` file with your database credentials:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/connecthub?schema=public"
   JWT_SECRET="your-super-secret-jwt-key-change-in-production"
   ```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Initialize Database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database and seed with sample data
npm run db:setup
```

### Step 4: Start the Server
```bash
npm run dev
```

The server will start on `http://localhost:3000`

### Step 5: Test the API
```bash
# Test all endpoints
npm run test:endpoints

# Or manually test health endpoint
curl http://localhost:3000/health
```

## 📝 Sample API Calls

### 1. Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@singapore.nsc",
    "password": "Password123!"
  }'
```

### 2. Get User Profile (with token from login)
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Get NSCs
```bash
curl -X GET http://localhost:3000/api/nsc \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Channels
```bash
curl -X GET http://localhost:3000/api/channels/NSC_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5. Send Message
```bash
curl -X POST http://localhost:3000/api/messages/NSC_ID/CHANNEL_ID \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello from ConnectHub API!",
    "type": "TEXT"
  }'
```

## 🏢 Sample Accounts

The setup script creates these test accounts:

| Account | Email | Password | Role | NSC Access |
|---------|-------|----------|------|------------|
| Admin | admin@singapore.nsc | Password123! | Admin | Singapore, Malaysia |
| User 1 | user1@singapore.nsc | Password123! | Member | Singapore |
| User 2 | user2@malaysia.nsc | Password123! | Member | Malaysia |

## 🛠 Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm start` | Start production server |
| `npm run db:studio` | Open Prisma Studio (database GUI) |
| `npm run db:migrate` | Create and apply database migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run test:endpoints` | Test API endpoints |

## 📊 Database Management

### View Database in Browser
```bash
npm run db:studio
```

### Reset Database (⚠️ Destroys all data)
```bash
npx prisma db push --force-reset
npm run db:seed
```

### Backup Database
```bash
pg_dump connecthub > backup.sql
```

## 🔧 Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Verify database exists: `createdb connecthub`

### Port Already in Use
```bash
# Find process using port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID_NUMBER> /F
```

### Permission Errors
- Ensure proper database user permissions
- Check file system permissions for uploads folder

## 🚀 Next Steps

1. **Add Real-time Features**: Integrate Socket.IO for live messaging
2. **File Uploads**: Implement file sharing functionality
3. **Windows SSO**: Configure Azure AD integration
4. **AI Bot**: Add chatbot for automated responses
5. **Mobile API**: Extend API for mobile app support

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [JWT.io](https://jwt.io/) - JWT token decoder
- [Postman Collection](./postman/) - API testing collection

## 🆘 Support

- Check the main [README.md](./README.md) for detailed documentation
- Open issues in the repository
- Check logs: `npm run dev` shows detailed error messages
