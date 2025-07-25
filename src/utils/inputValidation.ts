// Input validation and sanitization utilities

export const sanitizeInput = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove HTML tags and scripts
  let sanitized = input.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  // Remove potentially dangerous characters and XSS patterns
  sanitized = sanitized.replace(/[&<>"'`]/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/vbscript:/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');
  sanitized = sanitized.replace(/data:\s*text\/html/gi, '');
  
  // Remove SQL injection patterns
  sanitized = sanitized.replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Length limit
  if (sanitized.length > 1000) {
    sanitized = sanitized.substring(0, 1000);
  }
  
  return sanitized;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  // Allow various international phone formats
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''));
};

export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password is required');
    return { isValid: false, errors };
  }
  
  if (password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  if (password.length > 128) {
    errors.push('Password must be no more than 128 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Check for common weak patterns
  const commonPatterns = [
    /(.)\1{3,}/, // 4 or more repeated characters
    /123456|654321/, // Sequential numbers
    /abcdef|fedcba/, // Sequential letters
    /password|admin|user|test/i, // Common words
  ];
  
  for (const pattern of commonPatterns) {
    if (pattern.test(password)) {
      errors.push('Password contains weak patterns');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateFileUpload = (file: File): { isValid: boolean; error?: string } => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];
  
  const maxSizeBytes = 25 * 1024 * 1024; // Reduced to 25MB for security
  
  if (!file || !(file instanceof File)) {
    return {
      isValid: false,
      error: 'Invalid file object'
    };
  }
  
  // Check file size
  if (file.size === 0) {
    return {
      isValid: false,
      error: 'File is empty'
    };
  }
  
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: 'File size exceeds maximum limit of 25MB'
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not allowed. Allowed types: PDF, Images, Word documents, Text files'
    };
  }
  
  // Enhanced file name validation
  const fileName = sanitizeInput(file.name);
  if (fileName !== file.name) {
    return {
      isValid: false,
      error: 'File name contains invalid characters'
    };
  }
  
  // Check for suspicious file extensions (more comprehensive)
  const dangerousExtensions = /\.(exe|bat|cmd|com|pif|scr|vbs|js|jar|php|asp|jsp|ps1|sh|py|rb|pl|go|bin|app|deb|rpm|msi|dmg|pkg)$/i;
  if (dangerousExtensions.test(file.name)) {
    return {
      isValid: false,
      error: 'Potentially dangerous file type detected'
    };
  }
  
  // Check for suspicious file name patterns
  const suspiciousPatterns = [
    /^\./,  // Hidden files
    /\.(php|asp|jsp|py|rb|pl|go|sh|ps1)\./i, // Double extensions
    /[<>:"|?*]/  // Invalid filename characters
  ];
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(file.name)) {
      return {
        isValid: false,
        error: 'File name contains suspicious patterns'
      };
    }
  }
  
  return { isValid: true };
};

export const sanitizeFormData = <T extends Record<string, any>>(data: T): T => {
  const sanitized = { ...data };
  
  for (const key in sanitized) {
    if (typeof sanitized[key] === 'string') {
      (sanitized as any)[key] = sanitizeInput(sanitized[key] as string);
    }
  }
  
  return sanitized;
};

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateLength = (value: string, min: number, max: number, fieldName: string): string | null => {
  if (!value || typeof value !== 'string') {
    return `${fieldName} must be a valid string`;
  }
  
  if (value.length < min) {
    return `${fieldName} must be at least ${min} characters long`;
  }
  if (value.length > max) {
    return `${fieldName} must be no more than ${max} characters long`;
  }
  return null;
};

// Additional security validation functions
export const validateNumericInput = (value: any, fieldName: string, min?: number, max?: number): string | null => {
  const num = Number(value);
  
  if (isNaN(num)) {
    return `${fieldName} must be a valid number`;
  }
  
  if (min !== undefined && num < min) {
    return `${fieldName} must be at least ${min}`;
  }
  
  if (max !== undefined && num > max) {
    return `${fieldName} must be no more than ${max}`;
  }
  
  return null;
};

export const sanitizeHtml = (input: string): string => {
  if (!input || typeof input !== 'string') return '';
  
  // Remove all HTML tags and entities
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&[^;]+;/g, '')
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:/gi, '')
    .trim();
};

export const validateUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    // Only allow http and https protocols
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
};

export const rateLimit = (() => {
  const attempts: { [key: string]: number[] } = {};
  
  return (identifier: string, maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000): boolean => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!attempts[identifier]) {
      attempts[identifier] = [];
    }
    
    // Remove old attempts outside the window
    attempts[identifier] = attempts[identifier].filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (attempts[identifier].length >= maxAttempts) {
      return false;
    }
    
    // Add current attempt
    attempts[identifier].push(now);
    return true;
  };
})();