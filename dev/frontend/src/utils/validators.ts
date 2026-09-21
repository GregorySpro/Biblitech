/**
 * Form validation utilities
 */

export const validators = {
  /**
   * Validate ISBN-10 or ISBN-13 format
   */
  isValidISBN: (isbn: string): boolean => {
    const cleaned = isbn.replace(/[-\s]/g, '')
    // ISBN-10: 10 digits or X
    if (cleaned.length === 10) {
      return /^(?:\d{9}[\dX]|\d{10})$/.test(cleaned)
    }
    // ISBN-13: 13 digits starting with 978 or 979
    if (cleaned.length === 13) {
      return /^(?:978|979)\d{10}$/.test(cleaned)
    }
    return false
  },

  /**
   * Validate email format
   */
  isValidEmail: (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  },

  /**
   * Validate code format (alphanumeric with hyphens/underscores)
   */
  isValidCode: (code: string): boolean => {
    return /^[A-Za-z0-9\-_ .]{3,20}$/.test(code.trim())
  },

  /**
   * Validate year format (1900-2100)
   */
  isValidYear: (year: number): boolean => {
    return year >= 1900 && year <= 2100 && Number.isInteger(year)
  },

  /**
   * Validate name (at least 2 characters, allows letters, spaces, hyphens, apostrophes, dots, digits)
   */
  isValidName: (name: string): boolean => {
    return /^[a-zA-ZÀ-ÿ0-9\s\-'.,]{2,200}$/.test(name.trim())
  },

  /**
   * Validate password strength (min 8 chars, at least one uppercase, one number)
   */
  isStrongPassword: (password: string): boolean => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)
  },
}

export const errorMessages = {
  isbn: 'ISBN invalide. Format attendu: ISBN-10 ou ISBN-13',
  email: 'Format email invalide',
  code: 'Code invalide (3-20 caractères : lettres, chiffres, tiret, espace)',
  year: 'Année invalide (1900-2100)',
  name: 'Nom invalide (2-200 caractères)',
  password: 'Mot de passe faible (min. 8 caractères, 1 majuscule, 1 chiffre)',
  required: 'Champ obligatoire',
  duplicate: 'Cette valeur existe déjà',
}
