declare module 'express-rate-limit' {
  const rateLimit: any;
  export = rateLimit;
}

declare module 'pdf-parse' {
  interface PDFData {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }
  function pdf(dataBuffer: Buffer, options?: any): Promise<PDFData>;
  export = pdf;
}

declare module 'axios' {
  const axios: {
    create: (config?: any) => any;
    get: (url: string, config?: any) => any;
    post: (url: string, data?: any, config?: any) => any;
    put: (url: string, data?: any, config?: any) => any;
    delete: (url: string, config?: any) => any;
  };
  export = axios;
}

declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string, options?: any): any;
}