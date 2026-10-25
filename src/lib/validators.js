// Registration form validation — plain JavaScript control structures.
//
//  * HTML5 attributes on the <input>s (required, type="email", minlength,
//    pattern, maxlength) define the constraints and fill in `input.validity`.
//  * This file turns those flags into friendly messages with
//    switch / if-else / for / while, and adds the rules HTML5 can't express
//    (password strength, matching passwords).
//  * CSS (.field.is-invalid / .is-valid, :focus-visible) shows the result.

export const PASSWORD_RULES = [
  { id: 'length', label: 'At least 8 characters', test: pw => pw.length >= 8 },
  { id: 'letter', label: 'A letter', test: pw => /[A-Za-z]/.test(pw) },
  { id: 'number', label: 'A number', test: pw => /\d/.test(pw) },
  { id: 'mixed', label: 'Upper and lower case', test: pw => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { id: 'symbol', label: 'A symbol (e.g. ! @ #)', test: pw => /[^A-Za-z0-9]/.test(pw) },
];

// Loops over the rules and counts how many pass. Returns 0-5 plus a label.
export function passwordStrength(password) {
  let score = 0;
  const passed = [];
  for (let i = 0; i < PASSWORD_RULES.length; i++) {
    const rule = PASSWORD_RULES[i];
    if (rule.test(password)) {
      score++;
      passed.push(rule.id);
    }
  }

  let label;
  if (password.length === 0) label = '';
  else if (score <= 2) label = 'Weak';
  else if (score === 3) label = 'Okay';
  else if (score === 4) label = 'Good';
  else label = 'Strong';

  return { score, label, passed };
}

// Message for one HTML5 validity flag. `switch` picks the right wording.
function nativeMessage(field, input) {
  const v = input.validity;
  switch (true) {
    case v.valueMissing:
      return field === 'terms' ? 'Please accept the terms to continue.' : 'This field is required.';
    case v.typeMismatch:
      return 'Enter a valid email address, like name@example.com.';
    case v.tooShort:
      return `Use at least ${input.minLength} characters.`;
    case v.tooLong:
      return `Use at most ${input.maxLength} characters.`;
    case v.patternMismatch:
      return field === 'name'
        ? 'Use letters, spaces, apostrophes or hyphens only.'
        : 'That format is not allowed.';
    default:
      return '';
  }
}

// Validates one field. Returns '' when the value is fine.
export function validateField(field, input, values) {
  // 1) HTML5 constraint validation (the browser has already evaluated it).
  const native = nativeMessage(field, input);
  if (native) return native;

  // 2) Extra rules HTML5 cannot express.
  if (field === 'name') {
    if (values.name.trim().length < 2) return 'Name must have at least 2 characters.';
  } else if (field === 'password') {
    const { passed } = passwordStrength(values.password);
    if (!passed.includes('letter') || !passed.includes('number')) {
      return 'Password needs at least one letter and one number.';
    }
  } else if (field === 'confirm') {
    if (values.confirm !== values.password) return 'Passwords do not match.';
  }
  return '';
}

// Validates the whole form, returns { field: message } for every problem.
export function validateForm(formElement, values) {
  const errors = {};
  const fields = ['name', 'email', 'password', 'confirm', 'terms'];

  let i = 0;
  while (i < fields.length) {
    const field = fields[i];
    const input = formElement.elements[field];
    const message = input ? validateField(field, input, values) : '';
    if (message) errors[field] = message;
    i++;
  }
  return errors;
}
