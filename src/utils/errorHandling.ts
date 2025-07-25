// Centralized error handling and security utilities

export interface SecurityError {
  type: 'validation' | 'authentication' | 'authorization' | 'rate_limit' | 'xss' | 'injection';
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  userId?: string;
  ip?: string;
  userAgent?: string;
}

export class SecurityLogger {
  private static instance: SecurityLogger;
  private logs: SecurityError[] = [];

  private constructor() {}

  static getInstance(): SecurityLogger {
    if (!SecurityLogger.instance) {
      SecurityLogger.instance = new SecurityLogger();
    }
    return SecurityLogger.instance;
  }

  log(error: Omit<SecurityError, 'timestamp'>): void {
    const securityError: SecurityError = {
      ...error,
      timestamp: new Date(),
    };

    this.logs.push(securityError);
    
    // ...existing code...

    // In production, this would send to a security monitoring service
    if (securityError.severity === 'critical' || securityError.severity === 'high') {
      this.sendToSecurityService(securityError);
    }
  }

  private sendToSecurityService(error: SecurityError): void {
    // ...existing code...
  }

  getRecentLogs(limit: number = 100): SecurityError[] {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

export const handleError = (error: any, context: string = 'Unknown'): string => {
  const logger = SecurityLogger.getInstance();

  // Sanitize error messages to prevent information leakage
  let userMessage = 'An error occurred. Please try again.';
  let logMessage = error?.message || 'Unknown error';

  // Check for specific error types
  if (error?.code === 'WEAK_PASSWORD') {
    userMessage = 'Password does not meet security requirements.';
    logger.log({
      type: 'validation',
      message: `Weak password attempt in ${context}`,
      userMessage,
      severity: 'medium'
    });
  } else if (error?.code === 'EMAIL_NOT_CONFIRMED') {
    userMessage = 'Please verify your email address before signing in.';
  } else if (error?.code === 'INVALID_CREDENTIALS') {
    userMessage = 'Invalid email or password.';
    logger.log({
      type: 'authentication',
      message: `Invalid login attempt in ${context}`,
      userMessage,
      severity: 'medium'
    });
  } else if (error?.code === 'TOO_MANY_REQUESTS') {
    userMessage = 'Too many attempts. Please try again later.';
    logger.log({
      type: 'rate_limit',
      message: `Rate limit exceeded in ${context}`,
      userMessage,
      severity: 'high'
    });
  } else if (error?.code === 'USER_ALREADY_REGISTERED') {
    userMessage = 'An account with this email already exists.';
  } else if (error?.message?.includes('JWT')) {
    userMessage = 'Session expired. Please sign in again.';
    logger.log({
      type: 'authentication',
      message: `JWT error in ${context}: ${logMessage}`,
      userMessage,
      severity: 'medium'
    });
  } else if (error?.message?.includes('Row Level Security')) {
    userMessage = 'Access denied.';
    logger.log({
      type: 'authorization',
      message: `RLS violation in ${context}: ${logMessage}`,
      userMessage,
      severity: 'high'
    });
  } else {
    // Log unknown errors for investigation
    logger.log({
      type: 'validation',
      message: `Unknown error in ${context}: ${logMessage}`,
      userMessage,
      severity: 'medium'
    });
  }

  return userMessage;
};

export const validateSecureContext = (): boolean => {
  // Check if we're in a secure context (HTTPS in production)
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' ||
                       window.location.hostname.startsWith('192.168.');
    
    return window.location.protocol === 'https:' || isLocalhost;
  }
  return true; // Assume secure in SSR
};

export const getSecurityHeaders = (): Record<string, string> => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  };
};

// XSS Protection
export const preventXSS = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = input;
  return div.innerHTML;
};

// CSRF Token generation (simple implementation)
export const generateCSRFToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Session timeout management
export class SessionManager {
  private static timeoutId: NodeJS.Timeout | null = null;
  private static readonly TIMEOUT_DURATION = 30 * 60 * 1000; // 30 minutes

  static resetTimeout(callback?: () => void): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      if (callback) {
        callback();
      }
      // Clear any sensitive data from localStorage/sessionStorage
      localStorage.removeItem('supabase.auth.token');
      sessionStorage.clear();
    }, this.TIMEOUT_DURATION);
  }

  static clearTimeout(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// Content Security Policy helper
export const generateCSPNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode.apply(null, Array.from(array)));
};