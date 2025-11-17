// src/utils/validation.js

// Helpers
const isEmail = (v) => {
  // simple but robust-ish email regex (enough for validation feedback)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
};

const digitsOnly = (v) => v.replace(/\D/g, '');
const isPhone = (v) => {
  const n = digitsOnly(v);
  // accept international numbers (between 8 and 15 digits)
  return n.length >= 8 && n.length <= 15;
};


// exportable validator
export function validInput(val = '', min = 1, max = 255, type = '') {
  const value = String(val || '').trim();

  if (!value) {
    return 'The field cannot be empty';
  }

  switch (type) {
    case 'email':
      if (!isEmail(value)) return 'Invalid email (must contain @ and domain)';
      break;

    case 'phone':
      if (!isPhone(value)) return 'The phone number must be a valid 8–15 digit number';
      break;

    case 'emailOrPhone':
      if (!isEmail(value) && !isPhone(value)) {
        return 'Enter a valid email or a valid phone number (8–15 digits)';
      }
      break;

    case 'role': {
      const allowedRoles = ['secretary', 'center admin', 'admin', 'ministry'];
      if (!allowedRoles.includes(value)) {
        return `The job must be one of: ${allowedRoles.join(', ')}`;
      }
      break;
    }

    case 'password':
      // check length first
      if (value.length < Math.max(6, min)) {
        return `Must be at least ${Math.max(6, min)} characters long`;
      }
      
      break;

    default:
      break;
  }

  // generic length checks (for types not handled above or as extra)
  if (type !== 'password') {
    if (value.length < min) {
      return `Must be at least ${min} characters long`;
    }
    if (value.length > max) {
      return `Must not exceed ${max} characters`;
    }
  }

  return null; 
}
