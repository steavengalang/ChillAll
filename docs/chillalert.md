# ChillAlert

A minimal, framework-agnostic alert library that works identically everywhere.

[![Version](https://img.shields.io/badge/version-1.1.0-black.svg)](https://github.com/steavengalang/chillalert)
[![License](https://img.shields.io/badge/license-MIT-black.svg)](LICENSE)
[![Framework Agnostic](https://img.shields.io/badge/framework-agnostic-black.svg)](https://github.com/steavengalang/chillalert)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://github.com/steavengalang/chillalert)

## Features

- **Universal** - Works in vanilla JS, React, Vue, Next.js, Nuxt, and any JavaScript environment
- **Zero Dependencies** - No React, Vue, Tailwind, or framework dependencies
- **TypeScript Support** - Full type definitions included for TypeScript & JavaScript projects
- **Promise-Based** - Modern async/await API
- **Minimal Design** - Clean, professional aesthetic
- **Accessible** - Full keyboard support and ARIA labels
- **Dark Mode** - Automatic system preference support
- **Lightweight** - ~12KB minified

## Installation

### CDN (jsDelivr)

```html
<script src="https://cdn.jsdelivr.net/npm/chillalert@1.1.0/dist/chillalert.js"></script>
```

### NPM

```bash
npm install chillalert
```

### Direct Download

Download from [GitHub](https://github.com/steavengalang/chillalert/releases) and include:

```html
<script src="path/to/chillalert.js"></script>
```

## TypeScript Support

ChillAlert includes full TypeScript definitions out of the box. Works with:
- **React + TypeScript**
- **Next.js + TypeScript**
- **Vue + TypeScript**
- **Nuxt + TypeScript**

### TypeScript Usage (React/Next.js)

```tsx
// No import needed - ChillAlert is available globally
// Types are included automatically

const handleDelete = async (): Promise<void> => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone",
    confirmText: "Delete",
    cancelText: "Cancel"
  });

  if (confirmed) {
    // User clicked confirm
    ChillAlert.toast({
      text: "Item deleted!",
      type: "success"
    });
  }
};
```

### JavaScript Usage (React/Next.js)

```jsx
const handleDelete = async () => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  });

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" });
  }
};
```


## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/chillalert@latest/dist/chillalert.js"></script>
</head>
<body>
  <button onclick="showAlert()">Click Me</button>
  
  <script>
    async function showAlert() {
      await ChillAlert.alert({
        title: "Hello",
        text: "ChillAlert is working!",
        icon: "success"
      });
    }
  </script>
</body>
</html>
```

## API Reference

### Alert

Display a simple notification dialog.

```javascript
await ChillAlert.alert({
  title: "Success!",
  text: "Your operation completed successfully.",
  icon: "success",        // success | error | warning | info
  buttonText: "OK"        // Optional, default: "OK"
});
```

**Parameters:**
- `title` (string): Alert title
- `text` (string): Alert message
- `icon` (string): Icon type - `success`, `error`, `warning`, or `info`
- `buttonText` (string, optional): Button label, default is "OK"

**Returns:** `Promise<void>`

---

### 2. Confirm

Ask for user confirmation.

```javascript
const result = await ChillAlert.confirm({
  title: "Are you sure?",
  text: "This action cannot be undone.",
  confirmText: "Yes, delete",  // Optional, default: "Confirm"
  cancelText: "Cancel"          // Optional, default: "Cancel"
});

if (result) {
  // User confirmed
  console.log("User confirmed!");
} else {
  // User cancelled
  console.log("User cancelled");
}
```

**Parameters:**
- `title` (string): Dialog title
- `text` (string): Dialog message
- `confirmText` (string, optional): Confirm button label
- `cancelText` (string, optional): Cancel button label

**Returns:** `Promise<boolean>` - `true` if confirmed, `false` if cancelled

---

### 3. Toast

Show a lightweight notification that auto-dismisses.

```javascript
ChillAlert.toast({
  text: "Login successful!",
  type: "success",             // success | error | warning | info
  position: "top-right",       // top-right | top-left | bottom-right | bottom-left
  duration: 3000               // milliseconds, 0 = no auto-dismiss
});
```

**Parameters:**
- `text` (string): Toast message
- `type` (string): Toast type - `success`, `error`, `warning`, or `info`
- `position` (string, optional): Position - `top-right`, `top-left`, `bottom-right`, or `bottom-left`
- `duration` (number, optional): Auto-dismiss duration in milliseconds, 0 for manual dismiss

**Returns:** `{ toast, remove }` - Object with `remove()` method for manual control

**Manual Control:**
```javascript
const toast = ChillAlert.toast({
  text: "Processing...",
  duration: 0  // Won't auto-dismiss
});

// Later...
toast.remove();
```

---

### 4. Prompt

Collect user input.

```javascript
const name = await ChillAlert.prompt({
  title: "What's your name?",
  placeholder: "Enter your name",
  confirmText: "Submit",       // Optional, default: "Submit"
  cancelText: "Cancel",        // Optional, default: "Cancel"
  defaultValue: ""             // Optional, default: ""
});

if (name) {
  console.log(`Hello, ${name}!`);
} else {
  console.log("User cancelled");
}
```

**Parameters:**
- `title` (string): Dialog title
- `placeholder` (string, optional): Input placeholder
- `confirmText` (string, optional): Confirm button label  
- `cancelText` (string, optional): Cancel button label
- `defaultValue` (string, optional): Default input value

**Returns:** `Promise<string | null>` - Input value or `null` if cancelled

---

### 5. Loading

Show a loading indicator for async operations.

```javascript
const loader = ChillAlert.loading({
  text: "Processing your request..."
});

// Perform async operation
await fetch("/api/endpoint");
await processData();

// Close when done
loader.close();
```

**Parameters:**
- `text` (string): Loading message

**Returns:** `{ close }` - Object with `close()` method

---

## 🎨 Framework Integration

### The ChillAlert Guarantee

**ChillAlert behaves IDENTICALLY in all environments:**
- ✅ Same API
- ✅ Same visual output
- ✅ Same behavior
- ✅ Zero configuration needed

### Vanilla JavaScript

```html
<button onclick="handleClick()">Click Me</button>

<script>
  async function handleClick() {
    await ChillAlert.alert({
      title: "Hello!",
      text: "Vanilla JS works perfectly!",
      icon: "success"
    });
  }
</script>
```

### React

```jsx
import { useState } from 'react';

function MyComponent() {
  const [result, setResult] = useState(null);

  const handleDelete = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This cannot be undone"
    });

    if (confirmed) {
      // Delete logic
      ChillAlert.toast({
        text: "Item deleted!",
        type: "success"
      });
    }
  };

  const handleSubmit = async () => {
    const loader = ChillAlert.loading({
      text: "Saving..."
    });

    await saveData();
    loader.close();

    await ChillAlert.alert({
      title: "Saved!",
      icon: "success"
    });
  };

  return (
    <>
      <button onClick={handleDelete}>Delete</button>
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
```

### Vue 3

```vue
<template>
  <div>
    <button @click="showConfirm">Delete</button>
    <button @click="showPrompt">Enter Name</button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const userName = ref('');

const showConfirm = async () => {
  const result = await ChillAlert.confirm({
    title: "Are you sure?",
    text: "This action cannot be undone"
  });

  if (result) {
    ChillAlert.toast({
      text: "Action confirmed!",
      type: "success"
    });
  }
};

const showPrompt = async () => {
  const name = await ChillAlert.prompt({
    title: "What's your name?",
    placeholder: "Enter your name"
  });

  if (name) {
    userName.value = name;
    ChillAlert.toast({
      text: `Welcome, ${name}!`,
      type: "success"
    });
  }
};
</script>
```

### Next.js / React Server Components

```tsx
'use client'; // Must use client component for browser APIs

import { useEffect } from 'react';

export default function Page() {
  useEffect(() => {
    ChillAlert.toast({
      text: "Page loaded!",
      type: "info"
    });
  }, []);

  const handleAction = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Proceed?",
      text: "Are you sure you want to continue?"
    });

    if (confirmed) {
      // Your logic here
    }
  };

  return <button onClick={handleAction}>Click Me</button>;
}
```

### Nuxt 3

```vue
<template>
  <button @click="handleClick">Show Alert</button>
</template>

<script setup>
const handleClick = async () => {
  await ChillAlert.alert({
    title: "Nuxt Integration",
    text: "Works perfectly in Nuxt 3!",
    icon: "success"
  });
};

onMounted(() => {
  ChillAlert.toast({
    text: "Component mounted",
    type: "info"
  });
});
</script>
```

---

## 🎨 Customization

ChillAlert uses CSS variables for easy theming.

### Custom Colors

```css
:root {
  --chillalert-primary: #your-color;
  --chillalert-success: #your-success-color;
  --chillalert-error: #your-error-color;
  --chillalert-warning: #your-warning-color;
  --chillalert-info: #your-info-color;
  --chillalert-bg: #ffffff;
  --chillalert-text: #1f2937;
}
```

### Dark Mode

ChillAlert automatically supports dark mode via `prefers-color-scheme`. You can also override dark mode colors:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --chillalert-bg: #1f2937;
    --chillalert-text: #f9fafb;
  }
}
```

### Custom Styling

All ChillAlert elements use the `.chillalert-*` prefix. You can override styles if needed:

```css
.chillalert-modal {
  border-radius: 24px !important;
}

.chillalert-button-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
}
```

---

## 🛡️ Tailwind Compatibility

**ChillAlert is 100% Tailwind-safe.**

### Why It Works

1. **Scoped Styles** - All styles use `.chillalert-*` prefix
2. **CSS Reset** - ChillAlert applies its own reset to prevent inheritance
3. **High Specificity** - Styles won't be overridden by Tailwind
4. **No Tailwind Classes** - ChillAlert never uses Tailwind classes internally

### Example in Tailwind Project

```html
<!-- Your Tailwind App -->
<div class="p-4 bg-gray-100">
  <button 
    class="px-4 py-2 bg-blue-500 text-white rounded"
    onclick="ChillAlert.alert({ title: 'Hello!', icon: 'success' })"
  >
    Show Alert
  </button>
</div>
```

ChillAlert will look **exactly the same** whether Tailwind is present or not.

---

## ⌨️ Keyboard Support

- **ESC** - Close modal/dialog
- **ENTER** - Confirm action (in alert, confirm, and prompt)
- **TAB** - Navigate between buttons (focus trap)

---

## ♿ Accessibility

ChillAlert is built with accessibility in mind:

- ✅ Full keyboard navigation
- ✅ Focus trap within modals
- ✅ ARIA labels and roles
- ✅ Screen reader compatible
- ✅ Proper contrast ratios
- ✅ Focus indicators

---

## 🏗️ Architecture

### Core Principles

1. **Framework Agnostic** - Zero dependencies on React, Vue, or any framework
2. **Single Source of Truth** - One codebase, one visual output, one behavior
3. **DOM Injection** - ChillAlert creates its own DOM elements
4. **CSS Isolation** - Complete isolation from external CSS frameworks
5. **Memory Safe** - Automatic cleanup of DOM elements and event listeners

### How It Works

```
┌─────────────────────────────────────┐
│     Your Framework (optional)       │
│   React / Vue / Vanilla JS / etc    │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      ChillAlert Global API          │
│   window.ChillAlert.alert/confirm   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Core Engine (Pure JS)          │
├─────────────────────────────────────┤
│  • DOM Injection                    │
│  • State Manager                    │
│  • Animation Controller             │
│  • Accessibility Handler            │
│  • Cleanup Manager                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│      Browser DOM                    │
│   Pixel-identical everywhere        │
└─────────────────────────────────────┘
```

---

## 🌍 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers

**Requirements:** ES6+ support (Promises, async/await, const/let)

---

## 📊 Bundle Size

- **Full:** ~12KB (unminified)
- **Minified:** ~8KB
- **Gzipped:** ~3KB

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Credits

Built with ❄️ by the ChillAlert team.

Inspired by the need for a truly universal alert system that works identically everywhere.

---

## 🔗 Links

- [Documentation](https://github.com/yourusername/chillalert)
- [Demo](https://chillalert-demo.netlify.app)
- [NPM Package](https://npmjs.com/package/chillalert) (Coming Soon)
- [GitHub](https://github.com/yourusername/chillalert)

---

<div align="center">

**Made with ❄️ ChillAlert - Alert system that just works, everywhere.**

</div>
