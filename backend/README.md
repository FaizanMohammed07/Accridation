# AccridiTech - Accreditation Management System Backend

A comprehensive Node.js backend system for managing educational institution accreditations with role-based access control, document management, and audit trails.

## 🚀 Features

- **4 Role-Based Panels**: Admin, Institute, Reviewer, Auditor
- **Secure Authentication**: JWT-based with refresh tokens
- **Document Management**: Upload, review, audit workflow
- **Comprehensive Audit Trails**: Every action logged with IP, user agent, and details
- **Role-Based Access Control**: Fine-grained permissions for each user type
- **File Upload**: Cloudinary integration for secure document storage
- **Email Notifications**: Automated notifications for status updates and assignments
- **Security Features**: Account lockout, password hashing, rate limiting

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                 # MongoDB connection
│   └── cloudinary.js         # Cloudinary configuration
├── controllers/
│   ├── authController.js     # Authentication logic
│   ├── adminController.js    # Admin panel operations
│   ├── documentController.js # Document management
│   ├── reviewController.js   # Review workflow
│   ├── auditController.js    # Audit workflow
│   └── logController.js      # Activity logs
├── middlewares/
│   ├── authMiddleware.js     # JWT verification
│   ├── roleMiddleware.js     # Role-based access control
│   ├── errorMiddleware.js    # Global error handling
│   ├── logMiddleware.js      # Automatic logging
│   └── uploadMiddleware.js   # File upload handling
├── models/
│   ├── userModel.js          # User schema
│   ├── instituteModel.js     # Institute schema
│   ├── reviewerModel.js      # Reviewer profile schema
│   ├── auditorModel.js       # Auditor profile schema
│   ├── documentModel.js      # Document schema
│   ├── reviewModel.js        # Review schema
│   ├── auditModel.js         # Audit schema
│   └── logModel.js           # Activity log schema
├── routes/
│   ├── authRoutes.js         # Authentication routes
│   ├── adminRoutes.js        # Admin panel routes
│   ├── documentRoutes.js     # Document management routes
│   ├── reviewRoutes.js       # Review workflow routes
│   ├── auditRoutes.js        # Audit workflow routes
│   └── logRoutes.js          # Activity log routes
├── utils/
│   ├── asyncHandler.js       # Async error wrapper
│   ├── tokenUtils.js         # JWT token utilities
│   ├── logger.js             # Enhanced logging utility
│   └── emailService.js       # Email service
├── .env.example              # Environment variables template
├── package.json
└── server.js                 # Main server file
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Cloudinary account (for file storage)
- SMTP server (for email notifications)

### Step 1: Clone and Install Dependencies

```bash
# Install dependencies
npm install
```

### Step 2: Environment Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configurations
nano .env
```

**Required Environment Variables:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/accreditech

# JWT Secrets (generate strong secrets)
JWT_SECRET=your_super_secret_jwt_key_here
JWT_REFRESH_SECRET=your_super_secret_refresh_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Step 3: Database Setup

1. **Start MongoDB service**
```bash
# On macOS with Homebrew
brew services start mongodb/brew/mongodb-community

# On Linux
sudo systemctl start mongod

# On Windows
net start MongoDB
```

2. **Create initial admin user** (optional)
```bash
# Run the server first, then use the registration endpoint
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "email": "admin@accreditech.com",
    "password": "SecurePassword123!",
    "role": "admin"
  }'
```

### Step 4: Start the Server

```bash
# Development mode (with nodemon)
npm run dev

# Production mode
npm start
```

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Admin Panel Endpoints
- `GET /api/admin/dashboard` - Admin dashboard overview
- `GET /api/admin/institutes` - List all institutes
- `POST /api/admin/institutes` - Create new institute
- `PUT /api/admin/institutes/:id` - Update institute
- `GET /api/admin/reviewers` - List available reviewers
- `GET /api/admin/auditors` - List available auditors
- `POST /api/admin/assign-reviewer` - Assign reviewer to document
- `POST /api/admin/assign-auditor` - Assign auditor to document
- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/:id/status` - Update user status
- `GET /api/admin/reports` - Generate system reports

### Document Management Endpoints
- `POST /api/documents/upload` - Upload document (Institute)
- `GET /api/documents` - List documents (role-based filtering)
- `GET /api/documents/assigned` - Get assigned documents (Reviewer/Auditor)
- `GET /api/documents/:id` - Get single document
- `PUT /api/documents/:id` - Update document (Institute)
- `DELETE /api/documents/:id` - Delete document (Institute)
- `GET /api/documents/:id/download` - Download document
- `GET /api/documents/:id/history` - Get document status history
- `PUT /api/documents/:id/status` - Update document status (Admin)

### Review Workflow Endpoints
- `GET /api/reviews/dashboard` - Reviewer dashboard
- `POST /api/reviews/start/:documentId` - Start document review
- `PUT /api/reviews/:id` - Update review
- `POST /api/reviews/:id/submit` - Submit review
- `GET /api/reviews/:id` - Get review details
- `GET /api/reviews/document/:documentId` - Get all reviews for document

### Audit Workflow Endpoints
- `GET /api/audits/dashboard` - Auditor dashboard
- `POST /api/audits/start/:documentId` - Start document audit
- `PUT /api/audits/:id` - Update audit
- `POST /api/audits/:id/submit` - Submit audit with final decision
- `POST /api/audits/:id/findings` - Add audit finding
- `PUT /api/audits/:id/compliance` - Update compliance check
- `POST /api/audits/:id/validate-review` - Validate reviewer's assessment
- `GET /api/audits/:id` - Get audit details
- `GET /api/audits/document/:documentId` - Get all audits for document

### Activity Log Endpoints
- `GET /api/logs` - Get system logs (Admin)
- `GET /api/logs/user/:userId` - Get user activity logs
- `GET /api/logs/summary` - Get activity summary
- `POST /api/logs/export` - Export logs (Admin)
- `DELETE /api/logs/cleanup` - Clean up old logs (Admin)

## 🔐 Security Features

1. **JWT Authentication**: Secure token-based authentication with refresh tokens
2. **Password Security**: bcrypt hashing with salt rounds
3. **Account Protection**: Login attempt limits and account lockout
4. **Rate Limiting**: API rate limiting to prevent abuse
5. **CORS Protection**: Configurable cross-origin resource sharing
6. **Helmet Security**: Security headers and protection
7. **Input Validation**: Comprehensive input validation and sanitization
8. **Audit Trails**: Complete logging of all system activities

## 📊 User Roles & Permissions

### Admin
- Full system access
- Manage institutes, users, and assignments
- View all documents and reports
- Assign reviewers and auditors
- Access system logs and analytics

### Institute
- Upload and manage documents
- Track document progress
- View assigned reviews and audits
- Update institute profile

### Reviewer
- View assigned documents
- Conduct document reviews
- Submit review reports with scoring
- Track review history and performance

### Auditor
- View assigned documents and reviews
- Conduct audit validations
- Submit final decisions
- Manage compliance checks and findings
- Track audit history and performance

## 🔄 Document Workflow

1. **Institute** uploads document
2. **Admin** assigns reviewer
3. **Reviewer** conducts review and submits report
4. **Admin** assigns auditor
5. **Auditor** validates review and submits final decision
6. **Institute** receives final accreditation decision

## 🧪 Testing

Use tools like Postman or Insomnia to test the API endpoints. Import the provided collection or create test requests using the documented endpoints.

### Sample Test Flow:

1. Register admin user
2. Create institute
3. Upload document as institute
4. Assign reviewer as admin
5. Complete review as reviewer
6. Assign auditor as admin
7. Complete audit as auditor

## 🚀 Deployment

### Environment Variables for Production:
- Set `NODE_ENV=production`
- Use strong, unique JWT secrets
- Configure production database URI
- Set up production email service
- Configure production Cloudinary account

### Recommended Deployment Platforms:
- **Heroku**: Easy deployment with add-ons
- **AWS EC2**: Full control and scalability
- **Digital Ocean**: Cost-effective VPS solution
- **Railway**: Modern platform with Git integration

## 📈 Monitoring & Maintenance

- Monitor API response times and error rates
- Regular database backups
- Log rotation and cleanup (automated via `/api/logs/cleanup`)
- Security audit reviews
- Performance optimization based on usage patterns

## 🛡️ Security Best Practices

1. Regularly update dependencies
2. Use environment variables for all secrets
3. Implement proper backup strategies
4. Monitor for suspicious activities in logs
5. Regular security audits
6. Keep JWT secrets secure and rotate them periodically
7. Implement proper HTTPS in production
8. Use database connection pooling for performance

## 📞 Support

For technical support or questions, contact the AccridiTech development team.

---

**Built with ❤️ by AccridiTech Team**