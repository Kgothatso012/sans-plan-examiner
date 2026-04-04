// Type declarations for SANS Plan Examiner

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      applicantId?: string;
    }
  }
}

// JWT payload type
interface JwtPayload {
  applicantId?: string;
  email?: string;
  exp?: number;
}

// File upload type
interface FileUpload {
  originalname: string;
  path: string;
  mimetype: string;
  size: number;
}

// Application types
interface Application {
  id: string;
  erf_number: string;
  owner_name: string;
  owner_email: string;
  zoning: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'revision';
  created_at: string;
  updated_at: string;
}

export = {};
export {};