# ChillForm

Zero-dependency form validation library. Framework-agnostic, works everywhere.

## Installation

```bash
npm install chillform
```

Or via CDN:
```html
<script src="https://cdn.jsdelivr.net/npm/chillform@1.0.0/dist/chillform.js"></script>
```

## Usage

```javascript
const form = ChillForm.create('#myForm', {
  rules: {
    email: {
      required: true,
      email: true
    },
    password: {
      required: true,
      minLength: 8
    },
    confirmPassword: {
      required: true,
      match: 'password'
    }
  },
  onSubmit: async (data) => {
    console.log('Form submitted:', data);
  }
});
```

## Validation Rules

- `required` - Field must have a value
- `email` - Must be a valid email
- `minLength: n` - Minimum character length
- `maxLength: n` - Maximum character length
- `min: n` - Minimum numeric value
- `max: n` - Maximum numeric value
- `pattern: regex` - Must match regex pattern
- `match: 'fieldName'` - Must match another field

## Features

- Zero dependencies
- Real-time validation
- Dark mode support
- Fully responsive
- Custom validators
- Custom error messages

## License

MIT
