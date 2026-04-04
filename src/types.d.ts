// Type declarations for server.js
// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      applicantId?: string;
    }
  }
}

export {};