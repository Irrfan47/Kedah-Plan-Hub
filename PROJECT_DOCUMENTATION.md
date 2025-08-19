# Kedah Plan Hub - Complete Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [User Roles and Permissions](#user-roles-and-permissions)
6. [Application Workflows](#application-workflows)
7. [Frontend Structure](#frontend-structure)
8. [Backend API](#backend-api)
9. [Features and Functionality](#features-and-functionality)
10. [Security and Authentication](#security-and-authentication)
11. [File Management](#file-management)
12. [Deployment and Configuration](#deployment-and-configuration)
13. [Performance Optimization](#performance-optimization)
14. [Troubleshooting](#troubleshooting)

---

## Project Overview

**Kedah Plan Hub** is a comprehensive web-based program management system designed for the Kedah state government. The system facilitates the creation, submission, review, and approval of government programs with integrated document management, budget tracking, and multi-level approval workflows.

### Key Objectives
- Streamline program submission and approval processes
- Provide real-time status tracking and notifications
- Enable secure document upload and management
- Implement role-based access control
- Track budget allocation and usage
- Facilitate communication through queries and remarks

### Target Users
- **EXCO Users**: Program creators and managers
- **EXCO PAs**: Program assistants and coordinators
- **Finance Department**: Reviewers and approvers
- **Administrators**: System managers and user administrators

---

## System Architecture

### Frontend Architecture
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── layout/         # Layout components
│   └── ...             # Custom components
├── pages/              # Main application pages
├── contexts/           # React contexts (Auth, Language)
├── hooks/              # Custom React hooks
├── api/                # API integration layer
├── lib/                # Utility functions and icons
└── types/              # TypeScript type definitions
```

### Backend Architecture
```
api/
├── config.php          # Database configuration
├── schema.sql          # Database schema
├── *.php              # API endpoints
└── uploads/           # File storage directory
```

### Data Flow
1. **Frontend** → **API Layer** → **PHP Backend** → **MySQL Database**
2. **File Uploads** → **PHP Processing** → **File System Storage**
3. **Authentication** → **Session Management** → **Role-based Access**

---

## Technology Stack

### Frontend
- **React 18.3.1**: Modern UI library
- **TypeScript 5.5.3**: Type-safe development
- **Vite 5.4.1**: Fast build tool and dev server
- **Tailwind CSS 3.4.11**: Utility-first CSS framework
- **shadcn/ui**: High-quality UI components
- **React Router DOM 6.26.2**: Client-side routing
- **React Hook Form 7.53.0**: Form management
- **TanStack Query 5.56.2**: Data fetching and caching
- **Lucide React 0.462.0**: Icon library

### Backend
- **PHP**: Server-side scripting
- **MySQL**: Relational database
- **Apache/Nginx**: Web server
- **File System**: Document storage

### Development Tools
- **ESLint 9.9.0**: Code linting
- **TypeScript**: Static type checking
- **PostCSS**: CSS processing
- **Autoprefixer**: CSS vendor prefixing

---

## Database Schema

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20),
    role VARCHAR(50),
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Programs Table
```sql
CREATE TABLE programs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_name VARCHAR(255) NOT NULL,
    budget DECIMAL(12,2) NOT NULL,
    recipient_name VARCHAR(100) NOT NULL,
    exco_letter_ref VARCHAR(100),
    status VARCHAR(50) DEFAULT 'draft',
    created_by VARCHAR(100),
    created_at DATE,
    voucher_number VARCHAR(100),
    eft_number VARCHAR(100)
);
```

#### Documents Table
```sql
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    uploaded_by VARCHAR(100),
    document_type ENUM('original', 'finance') DEFAULT 'original',
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
```

#### Queries Table
```sql
CREATE TABLE queries (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    question TEXT NOT NULL,
    answer TEXT,
    answered TINYINT(1) DEFAULT 0,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
```

#### Remarks Table
```sql
CREATE TABLE remarks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    program_id INT NOT NULL,
    remark TEXT NOT NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
```

#### Budget Table
```sql
CREATE TABLE budget (
    id INT AUTO_INCREMENT PRIMARY KEY,
    total_budget DECIMAL(12,2) NOT NULL
);
```

#### Notifications Table
```sql
CREATE TABLE notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read TINYINT(1) DEFAULT 0,
    program_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE
);
```

---

## User Roles and Permissions

### 1. Admin Role
**Capabilities:**
- Full system access
- User management (create, edit, delete, activate/deactivate users)
- View all programs and statistics
- System configuration
- Budget management

**Access to Pages:**
- Dashboard
- User Management
- Status Tracking
- Program Management (view only)
- Profile

### 2. EXCO User Role
**Capabilities:**
- Create new programs
- Edit draft programs
- Submit programs for review
- Upload documents
- Add remarks
- View own programs
- Answer queries from Finance

**Access to Pages:**
- Dashboard
- Program Management
- Query Management
- Status Tracking
- Profile

### 3. EXCO PA Role
**Capabilities:**
- All EXCO User capabilities
- Answer queries on behalf of EXCO Users
- Enhanced program management
- Document management

**Access to Pages:**
- Dashboard
- Program Management
- Query Management
- Status Tracking
- Profile

### 4. Finance Role
**Capabilities:**
- Review submitted programs
- Approve or reject programs
- Add finance documents
- Submit queries to programs
- Update voucher and EFT numbers
- View all programs

**Access to Pages:**
- Dashboard
- Program Management (review mode)
- Query Management
- Status Tracking
- Profile

---

## Application Workflows

### Program Creation Workflow

1. **Draft Creation** (EXCO User/PA)
   - Create new program with basic details
   - Upload supporting documents
   - Save as draft

2. **Program Submission** (EXCO User/PA)
   - Review program details
   - Submit for Finance review
   - Status changes to "Under Review"

3. **Finance Review** (Finance User)
   - Review program details and documents
   - Can approve, reject, or submit queries
   - Upload additional finance documents if needed

4. **Query Process** (Finance → EXCO)
   - Finance submits query about missing documents/concerns
   - EXCO User/PA responds to query
   - Status changes to "Query Answered"

5. **Final Approval** (Finance User)
   - Review query responses
   - Add voucher and EFT numbers
   - Approve or reject program

### Document Management Workflow

1. **Original Documents** (EXCO Users)
   - Upload during program creation
   - Can add/remove documents in draft status
   - Documents locked after submission

2. **Finance Documents** (Finance Users)
   - Upload during review process
   - Can add documents to programs under review
   - Separate from original documents

### Query Management Workflow

1. **Query Submission** (Finance Users)
   - Submit queries about program details
   - Query appears in program details
   - Status changes to "Query"

2. **Query Response** (EXCO Users/PAs)
   - View queries in Query Management page
   - Provide detailed responses
   - Upload additional documents if needed

3. **Query Resolution** (Finance Users)
   - Review responses and additional documents
   - Approve or submit additional queries

---

## Frontend Structure

### Core Components

#### Authentication System
- **AuthContext**: Manages user authentication state
- **ProtectedRoute**: Route protection based on authentication
- **Login Page**: User authentication interface

#### Layout Components
- **DashboardLayout**: Main application layout
- **AppSidebar**: Navigation sidebar
- **LanguageSwitcher**: Multi-language support

#### UI Components (shadcn/ui)
- **Cards**: Information display
- **Tables**: Data presentation
- **Forms**: Data input and validation
- **Modals**: Overlay dialogs
- **Buttons**: Interactive elements
- **Badges**: Status indicators

### Page Structure

#### Dashboard Page
- **Statistics Cards**: Program counts and budget overview
- **Recent Programs**: Latest program submissions
- **Budget Management**: Total and remaining budget display

#### Program Management Page
- **Program List**: Filterable table of programs
- **Program Creation**: Modal form for new programs
- **Program Editing**: Update program details
- **Document Management**: Upload and manage documents
- **Status Management**: Submit, approve, reject programs

#### Query Management Page
- **Active Queries**: Programs with pending queries
- **Query History**: Resolved queries
- **Query Response**: Answer queries from Finance

#### User Management Page (Admin Only)
- **User List**: All system users
- **User Creation**: Add new users
- **User Editing**: Update user information
- **User Status**: Activate/deactivate users

#### Status Tracking Page
- **Program Overview**: All programs with status
- **Filtering**: Search and filter capabilities
- **Status Statistics**: Count by status

---

## Backend API

### Authentication Endpoints

#### POST /api/login.php
**Purpose**: User authentication
**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "1",
    "full_name": "John Doe",
    "email": "user@example.com",
    "role": "exco_user",
    "is_active": 1
  }
}
```

### User Management Endpoints

#### GET /api/users.php
**Purpose**: Get all users (Admin only)
**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": "1",
      "full_name": "John Doe",
      "email": "user@example.com",
      "role": "exco_user",
      "is_active": 1
    }
  ]
}
```

#### POST /api/users.php
**Purpose**: Create new user (Admin only)
**Request Body**:
```json
{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "password": "password123",
  "phone_number": "+60123456789",
  "role": "exco_user"
}
```

### Program Management Endpoints

#### GET /api/programs.php
**Purpose**: Get all programs
**Response**:
```json
{
  "success": true,
  "programs": [
    {
      "id": "1",
      "program_name": "Community Development",
      "budget": 50000.00,
      "recipient_name": "Ahmad bin Abdullah",
      "status": "under_review",
      "created_by": "John Doe",
      "created_at": "2024-01-15",
      "documents": [...],
      "queries": [...],
      "remarks": [...]
    }
  ]
}
```

#### POST /api/programs.php
**Purpose**: Create new program
**Request Body**:
```json
{
  "program_name": "Community Development",
  "budget": 50000.00,
  "recipient_name": "Ahmad bin Abdullah",
  "exco_letter_ref": "EXC/2024/001",
  "created_by": "John Doe",
  "status": "draft"
}
```

### Document Management Endpoints

#### POST /api/upload_document.php
**Purpose**: Upload document
**Request**: Multipart form data
**Parameters**:
- `program_id`: Program ID
- `file`: File to upload
- `uploaded_by`: User name
- `document_type`: "original" or "finance"

#### GET /api/download_document.php?id={document_id}
**Purpose**: Download document
**Response**: File download

### Query Management Endpoints

#### POST /api/queries.php
**Purpose**: Create query
**Request Body**:
```json
{
  "program_id": "1",
  "question": "Please provide additional documentation",
  "created_by": "Finance User"
}
```

#### PUT /api/queries.php
**Purpose**: Answer query
**Request Body**:
```json
{
  "query_id": "1",
  "answer": "Additional documents have been uploaded",
  "answered_by": "EXCO User"
}
```

---

## Features and Functionality

### Core Features

#### 1. Program Management
- **Create Programs**: EXCO users can create new programs with details
- **Edit Programs**: Modify program details in draft status
- **Submit Programs**: Submit for Finance review
- **Status Tracking**: Real-time status updates
- **Document Upload**: Support for multiple file types

#### 2. Document Management
- **File Upload**: Support for PDF, images, and office documents
- **Document Types**: Original and Finance document categories
- **File Preview**: Image preview in browser
- **File Download**: Secure file downloads
- **Document Deletion**: Remove documents (with permissions)

#### 3. Query System
- **Query Submission**: Finance can submit queries about programs
- **Query Response**: EXCO users can respond to queries
- **Query History**: Track all queries and responses
- **Status Updates**: Automatic status changes based on queries

#### 4. Budget Management
- **Total Budget**: Set and manage total available budget
- **Budget Tracking**: Track used and remaining budget
- **Budget Updates**: Finance can update total budget
- **Budget Visualization**: Progress bars and statistics

#### 5. User Management
- **User Creation**: Admins can create new users
- **Role Assignment**: Assign appropriate roles to users
- **User Status**: Activate/deactivate users
- **Profile Management**: Users can update their profiles

#### 6. Notifications
- **Status Notifications**: Notify users of program status changes
- **Query Notifications**: Alert users of new queries
- **System Notifications**: General system announcements

### Advanced Features

#### 1. Multi-language Support
- **Language Context**: React context for language management
- **Translation System**: Support for multiple languages
- **Language Switcher**: UI component for language selection

#### 2. Performance Optimization
- **Code Splitting**: Lazy loading of components
- **Image Optimization**: Efficient image handling
- **Caching**: React Query for data caching
- **Bundle Optimization**: Vite for fast builds

#### 3. Security Features
- **Authentication**: Secure login system
- **Authorization**: Role-based access control
- **Session Management**: Secure session handling
- **Input Validation**: Server-side validation

#### 4. File Security
- **Secure Uploads**: Validated file uploads
- **File Type Restrictions**: Allowed file types
- **Virus Scanning**: Basic file validation
- **Access Control**: Role-based file access

---

## Security and Authentication

### Authentication System
- **Session-based**: PHP sessions for authentication
- **Password Hashing**: Secure password storage
- **Token Management**: Session token validation
- **Logout Functionality**: Secure session termination

### Authorization
- **Role-based Access**: Different permissions per role
- **Route Protection**: Protected routes based on authentication
- **API Security**: Server-side permission validation
- **Data Isolation**: Users see only authorized data

### Security Measures
- **SQL Injection Prevention**: Prepared statements
- **XSS Protection**: Input sanitization
- **CSRF Protection**: Cross-site request forgery prevention
- **File Upload Security**: Validated file uploads

---

## File Management

### Supported File Types
- **Documents**: PDF, DOC, DOCX
- **Images**: JPG, JPEG, PNG, GIF, BMP, WebP
- **Spreadsheets**: XLS, XLSX
- **Presentations**: PPT, PPTX

### File Storage
- **Local Storage**: Files stored on server
- **Organized Structure**: Year/month/day folders
- **Unique Naming**: Prevents filename conflicts
- **Backup Strategy**: Regular file backups

### File Operations
- **Upload**: Secure file upload with validation
- **Download**: Secure file download with access control
- **Preview**: Image preview in browser
- **Delete**: Secure file deletion with permissions

---

## Deployment and Configuration

### Environment Setup

#### Frontend Configuration
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

#### Backend Configuration
1. **Database Setup**:
   ```sql
   -- Import schema
   mysql -u username -p database_name < api/schema.sql
   ```

2. **PHP Configuration**:
   ```php
   // Update api/config.php
   $host = 'localhost';
   $db = 'your_database_name';
   $user = 'your_database_username';
   $pass = 'your_database_password';
   ```

3. **File Permissions**:
   ```bash
   chmod 755 api/uploads/
   chmod 644 api/*.php
   ```

### Production Deployment

#### Frontend Deployment
1. **Build Application**:
   ```bash
   npm run build
   ```

2. **Deploy to Web Server**:
   - Upload `dist/` contents to web server
   - Configure server for SPA routing

#### Backend Deployment
1. **Upload PHP Files**:
   - Upload `api/` directory to web server
   - Ensure proper file permissions

2. **Database Configuration**:
   - Update database credentials
   - Import database schema
   - Test database connections

3. **Server Configuration**:
   - Configure PHP settings
   - Set up file upload limits
   - Enable required PHP extensions

### Environment Variables
```bash
# Database Configuration
DB_HOST=localhost
DB_NAME=kedah_plan_hub
DB_USER=username
DB_PASS=password

# Application Settings
APP_URL=https://your-domain.com
APP_ENV=production
UPLOAD_MAX_SIZE=10M
```

---

## Performance Optimization

### Frontend Optimizations
- **Code Splitting**: Lazy loading of routes and components
- **Image Optimization**: Efficient image handling and compression
- **Bundle Optimization**: Tree shaking and minification
- **Caching**: React Query for data caching
- **CDN Usage**: Static assets served from CDN

### Backend Optimizations
- **Database Indexing**: Optimized database queries
- **Connection Pooling**: Efficient database connections
- **File Compression**: Gzip compression for responses
- **Caching**: Redis caching for frequently accessed data

### Monitoring and Analytics
- **Performance Monitoring**: Built-in performance tracking
- **Error Logging**: Comprehensive error logging
- **User Analytics**: Usage statistics and metrics
- **System Health**: Server and application monitoring

---

## Troubleshooting

### Common Issues

#### 1. Login Problems
**Symptoms**: Unable to login, authentication errors
**Solutions**:
- Check database connection
- Verify user credentials
- Clear browser cache and cookies
- Check PHP session configuration

#### 2. File Upload Issues
**Symptoms**: File upload failures, permission errors
**Solutions**:
- Check file upload limits in PHP
- Verify directory permissions
- Validate file types and sizes
- Check server disk space

#### 3. Database Connection Issues
**Symptoms**: Database errors, connection timeouts
**Solutions**:
- Verify database credentials
- Check database server status
- Test database connectivity
- Review database logs

#### 4. Performance Issues
**Symptoms**: Slow loading, timeouts
**Solutions**:
- Optimize database queries
- Enable caching
- Compress static assets
- Monitor server resources

### Debugging Tools
- **Browser Developer Tools**: Frontend debugging
- **PHP Error Logs**: Backend error tracking
- **Database Logs**: Query performance monitoring
- **Network Monitoring**: API request/response tracking

### Support and Maintenance
- **Regular Backups**: Database and file backups
- **Security Updates**: Regular security patches
- **Performance Monitoring**: Continuous performance tracking
- **User Training**: Regular user training sessions

---

## Conclusion

The Kedah Plan Hub is a comprehensive program management system designed to streamline government program workflows. With its robust architecture, secure authentication, and user-friendly interface, it provides an efficient solution for program creation, review, and approval processes.

The system's modular design allows for easy maintenance and future enhancements, while its role-based access control ensures data security and proper workflow management. The integration of document management, query systems, and budget tracking provides a complete solution for government program administration.

For technical support or feature requests, please contact the development team or refer to the system documentation for detailed implementation guides. 