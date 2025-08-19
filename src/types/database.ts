// Database interfaces for easy MySQL backend integration

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  password_hash: string;
  role: 'admin' | 'exco_user' | 'exco_pa' | 'finance';
  is_active: boolean;
  profile_photo?: string; // BLOB or file path
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface Program {
  id: string;
  program_name: string;
  budget: number;
  recipient_name: string;
  exco_letter_ref: string;
  status: 'draft' | 'under_review' | 'query' | 'query_answered' | 'approved' | 'rejected';
  created_by: string; // User ID
  voucher_number?: string;
  eft_number?: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  program_id: string;
  document_name: string;
  document_type: 'program_document' | 'signed_document';
  file_data: Blob; // BLOB storage
  file_size: number;
  mime_type: string;
  uploaded_by: string; // User ID
  uploaded_at: string;
}

export interface Remark {
  id: string;
  program_id: string;
  message: string;
  created_by: string; // User ID
  created_at: string;
}

export interface Query {
  id: string;
  program_id: string;
  question: string;
  answer?: string;
  asked_by: string; // User ID (Finance)
  answered_by?: string; // User ID (EXCO PA)
  asked_at: string;
  answered_at?: string;
  is_answered: boolean;
}

export interface BudgetSetting {
  id: string;
  total_budget: number;
  remaining_budget: number;
  fiscal_year: string;
  set_by: string; // User ID (Finance)
  updated_at: string;
}

// SQL Table Creation Scripts for MySQL
export const SQL_TABLES = {
  users: `
    CREATE TABLE users (
      id VARCHAR(36) PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone_number VARCHAR(50) NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role ENUM('admin', 'exco_user', 'exco_pa', 'finance') NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      profile_photo LONGBLOB,
      total_budget DECIMAL(15,2) DEFAULT 0.00,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      last_login TIMESTAMP NULL DEFAULT NULL,
      INDEX idx_email (email),
      INDEX idx_role (role)
    );
  `,
  
  programs: `
    CREATE TABLE programs (
      id VARCHAR(36) PRIMARY KEY,
      program_name VARCHAR(500) NOT NULL,
      budget DECIMAL(15,2) NOT NULL,
      recipient_name VARCHAR(255) NOT NULL,
      exco_letter_ref VARCHAR(100) NOT NULL,
      status ENUM('draft', 'under_review', 'query', 'query_answered', 'approved', 'rejected') DEFAULT 'draft',
      created_by VARCHAR(36) NOT NULL,
      voucher_number VARCHAR(100),
      eft_number VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status),
      INDEX idx_created_by (created_by),
      INDEX idx_created_at (created_at)
    );
  `,
  
  documents: `
    CREATE TABLE documents (
      id VARCHAR(36) PRIMARY KEY,
      program_id VARCHAR(36) NOT NULL,
      document_name VARCHAR(500) NOT NULL,
      document_type ENUM('program_document', 'signed_document') NOT NULL,
      file_data LONGBLOB NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(255) NOT NULL,
      uploaded_by VARCHAR(36) NOT NULL,
      uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_program_id (program_id),
      INDEX idx_document_type (document_type)
    );
  `,
  
  remarks: `
    CREATE TABLE remarks (
      id VARCHAR(36) PRIMARY KEY,
      program_id VARCHAR(36) NOT NULL,
      message TEXT NOT NULL,
      created_by VARCHAR(36) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_program_id (program_id),
      INDEX idx_created_at (created_at)
    );
  `,
  
  queries: `
    CREATE TABLE queries (
      id VARCHAR(36) PRIMARY KEY,
      program_id VARCHAR(36) NOT NULL,
      question TEXT NOT NULL,
      answer TEXT,
      asked_by VARCHAR(36) NOT NULL,
      answered_by VARCHAR(36),
      asked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      answered_at TIMESTAMP NULL,
      is_answered BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
      FOREIGN KEY (asked_by) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_program_id (program_id),
      INDEX idx_is_answered (is_answered)
    );
  `,
  
  budget_settings: `
    CREATE TABLE budget_settings (
      id VARCHAR(36) PRIMARY KEY,
      total_budget DECIMAL(15,2) NOT NULL,
      remaining_budget DECIMAL(15,2) NOT NULL,
      fiscal_year VARCHAR(10) NOT NULL,
      set_by VARCHAR(36) NOT NULL,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (set_by) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_fiscal_year (fiscal_year)
    );
  `
};

// API Endpoint Structure for Backend Integration
export const API_ENDPOINTS = {
  // Authentication
  login: 'POST /api/auth/login',
  logout: 'POST /api/auth/logout',
  refreshToken: 'POST /api/auth/refresh',
  
  // Users
  getUsers: 'GET /api/users',
  createUser: 'POST /api/users',
  updateUser: 'PUT /api/users/:id',
  deleteUser: 'DELETE /api/users/:id',
  getUserProfile: 'GET /api/users/profile',
  updateProfile: 'PUT /api/users/profile',
  changePassword: 'PUT /api/users/change-password',
  uploadProfilePhoto: 'POST /api/users/profile-photo',
  
  // Programs
  getPrograms: 'GET /api/programs',
  createProgram: 'POST /api/programs',
  updateProgram: 'PUT /api/programs/:id',
  deleteProgram: 'DELETE /api/programs/:id',
  submitProgram: 'POST /api/programs/:id/submit',
  approveProgram: 'POST /api/programs/:id/approve',
  rejectProgram: 'POST /api/programs/:id/reject',
  
  // Documents
  uploadDocument: 'POST /api/programs/:id/documents',
  getDocuments: 'GET /api/programs/:id/documents',
  downloadDocument: 'GET /api/documents/:id/download',
  deleteDocument: 'DELETE /api/documents/:id',
  
  // Remarks
  addRemark: 'POST /api/programs/:id/remarks',
  getRemarks: 'GET /api/programs/:id/remarks',
  
  // Queries
  createQuery: 'POST /api/programs/:id/queries',
  answerQuery: 'PUT /api/queries/:id/answer',
  getQueries: 'GET /api/programs/:id/queries',
  
  // Budget
  getBudgetSettings: 'GET /api/budget',
  updateBudgetSettings: 'PUT /api/budget',
  
  // Dashboard Stats
  getDashboardStats: 'GET /api/dashboard/stats',
  getRecentPrograms: 'GET /api/dashboard/recent-programs'
};