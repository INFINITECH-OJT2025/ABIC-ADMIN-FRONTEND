// lib/validators.ts

export interface ValidationResult {
    isValid: boolean
    message?: string
  }
  
  export function validateEmail(email: string): ValidationResult {
    if (!email || !email.trim()) {
      return { isValid: false, message: "Email is required." }
    }
  
    const trimmedEmail = email.trim()
  
    // RFC length limits
    if (trimmedEmail.length > 254) {
      return { isValid: false, message: "Email is too long." }
    }
  
    // Basic structure check
    const basicRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/
  
    if (!basicRegex.test(trimmedEmail)) {
      return { isValid: false, message: "Invalid email format." }
    }
  
    const [localPart, domain] = trimmedEmail.split("@")
  
    // Local part checks
    if (localPart.length > 64) {
      return { isValid: false, message: "Email local part is too long." }
    }
  
    if (localPart.startsWith(".") || localPart.endsWith(".")) {
      return { isValid: false, message: "Email cannot start or end with a dot." }
    }
  
    if (localPart.includes("..")) {
      return { isValid: false, message: "Email cannot contain consecutive dots." }
    }
  
    // Domain checks
    if (domain.includes("..")) {
      return { isValid: false, message: "Domain cannot contain consecutive dots." }
    }
  
    const domainParts = domain.split(".")
    if (domainParts.some(part => part.length === 0)) {
      return { isValid: false, message: "Invalid domain structure." }
    }
  
    return { isValid: true }
  }