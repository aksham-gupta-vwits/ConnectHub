<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# ConnectHub - Internal Communication Platform

This is a multi-tenant internal communication platform backend for NSCs (National Service Centers) in the APAC region, built with Node.js, Express, Prisma, and PostgreSQL.

## Project Structure
- `src/server.js` - Main server entry point
- `src/routes/` - API route handlers
- `src/middleware/` - Express middleware (auth, security, logging)
- `src/config/` - Configuration files
- `src/services/` - Business logic services
- `src/utils/` - Utility functions
- `prisma/` - Database schema and migrations

## Key Features
- **Multi-tenant architecture**: Each NSC is a separate tenant
- **Dual authentication**: Windows SSO + form-based auth
- **Role-based access control**: Flexible permissions system
- **Secure communication**: End-to-end encrypted messaging
- **Channel management**: Public, private, and direct messages
- **User management**: Search, invite, and manage users across NSCs
- **AI-ready**: Structured for future bot integration

## Security Focus
- JWT-based authentication
- Rate limiting and DDoS protection
- Input validation and sanitization
- SQL injection prevention via Prisma
- CORS configuration
- Security headers (Helmet.js equivalent)
- Audit logging

## Database Schema
- Multi-tenant with row-level security
- Users can belong to multiple NSCs
- Channels are NSC-specific
- Messages support text, files, and metadata
- Role-based permissions stored as JSON

## API Patterns
- RESTful endpoints with consistent error handling
- Proper HTTP status codes
- Pagination for list endpoints
- Search functionality with filters
- Transaction handling for complex operations

## Development Guidelines
- Use Prisma for all database operations
- Always validate user input
- Implement proper error handling
- Follow the middleware chain for authentication
- Use transactions for multi-step operations
- Log security-relevant events

## Future Enhancements
- Real-time messaging with Socket.IO
- File upload and sharing
- Video/audio calling integration
- AI chatbot for query resolution
- Multilingual support (i18n)
- Push notifications
- Mobile app support
