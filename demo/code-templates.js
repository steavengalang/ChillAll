// ChillAlert Demo - Code Templates
// This file contains all code examples for different framework/language/styling combinations

window.codeTemplates = {
    'react-typescript-tailwind': `// Install
npm install chillalert

// App.tsx
export default function App() {
  const handleDelete = async (): Promise<void> => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded-lg"
    >
      Delete
    </button>
  )
}`,

    'react-typescript-css': `// Install
npm install chillalert

// App.tsx
import "./App.css"

export default function App() {
  const handleDelete = async (): Promise<void> => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button onClick={handleDelete} className="delete-btn">
      Delete
    </button>
  )
}

/* App.css */
.delete-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
}`,

    'react-javascript-tailwind': `// Install
npm install chillalert

// App.jsx
export default function App() {
  const handleDelete = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded-lg"
    >
      Delete
    </button>
  )
}`,

    'react-javascript-css': `// Install
npm install chillalert

// App.jsx
import "./App.css"

export default function App() {
  const handleDelete = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button onClick={handleDelete} className="delete-btn">
      Delete
    </button>
  )
}`,

    'nextjs-typescript-tailwind': `// Install
npm install chillalert

// app/page.tsx
"use client"

export default function Page() {
  const handleDelete = async (): Promise<void> => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded-lg"
    >
      Delete
    </button>
  )
}`,

    'nextjs-typescript-css': `// Install
npm install chillalert

// app/page.tsx
"use client"
import styles from "./page.module.css"

export default function Page() {
  const handleDelete = async (): Promise<void> => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button onClick={handleDelete} className={styles.deleteBtn}>
      Delete
    </button>
  )
}

/* page.module.css */
.deleteBtn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border-radius: 8px;
}`,

    'nextjs-javascript-tailwind': `// Install
npm install chillalert

// app/page.jsx
"use client"

export default function Page() {
  const handleDelete = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button
      onClick={handleDelete}
      className="px-4 py-2 bg-red-500 text-white rounded-lg"
    >
      Delete
    </button>
  )
}`,

    'nextjs-javascript-css': `// Install
npm install chillalert

// app/page.jsx
"use client"
import "./page.css"

export default function Page() {
  const handleDelete = async () => {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }

  return (
    <button onClick={handleDelete} className="delete-btn">
      Delete
    </button>
  )
}`,

    'vue-typescript-tailwind': `// Install
npm install chillalert

// Component.vue
<script setup lang="ts">
const handleDelete = async (): Promise<void> => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}
</script>

<template>
  <button @click="handleDelete" class="px-4 py-2 bg-red-500 text-white rounded-lg">
    Delete
  </button>
</template>`,

    'vue-typescript-css': `// Install
npm install chillalert

// Component.vue
<script setup lang="ts">
const handleDelete = async (): Promise<void> => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}
</script>

<template>
  <button @click="handleDelete" class="delete-btn">Delete</button>
</template>

<style scoped>
.delete-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border-radius: 8px;
}
</style>`,

    'vue-javascript-tailwind': `// Install
npm install chillalert

// Component.vue
<script setup>
const handleDelete = async () => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}
</script>

<template>
  <button @click="handleDelete" class="px-4 py-2 bg-red-500 text-white rounded-lg">
    Delete
  </button>
</template>`,

    'vue-javascript-css': `// Install
npm install chillalert

// Component.vue
<script setup>
const handleDelete = async () => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}
</script>

<template>
  <button @click="handleDelete" class="delete-btn">Delete</button>
</template>

<style scoped>
.delete-btn {
  padding: 8px 16px;
  background: #ef4444;
  color: white;
  border-radius: 8px;
}
</style>`,

    'vanilla-javascript-tailwind': `<!-- CDN -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chillalert@1.1.0/dist/chillalert.js"></script>

<button onclick="handleDelete()" class="px-4 py-2 bg-red-500 text-white rounded-lg">
  Delete
</button>

<script>
  async function handleDelete() {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }
</script>`,

    'vanilla-javascript-css': `<!-- CDN -->
<script src="https://cdn.jsdelivr.net/npm/chillalert@1.1.0/dist/chillalert.js"></script>

<style>
  .delete-btn {
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
  }
</style>

<button onclick="handleDelete()" class="delete-btn">Delete</button>

<script>
  async function handleDelete() {
    const confirmed = await ChillAlert.confirm({
      title: "Delete item?",
      text: "This action cannot be undone"
    })

    if (confirmed) {
      ChillAlert.toast({ text: "Deleted!", type: "success" })
    }
  }
</script>`,

    'vanilla-typescript-tailwind': `<!-- TypeScript requires build setup -->
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chillalert@1.1.0/dist/chillalert.js"></script>

// main.ts
const handleDelete = async (): Promise<void> => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}`,

    'vanilla-typescript-css': `<!-- TypeScript requires build setup -->
<script src="https://cdn.jsdelivr.net/npm/chillalert@1.1.0/dist/chillalert.js"></script>

<style>
  .delete-btn {
    padding: 8px 16px;
    background: #ef4444;
    color: white;
    border-radius: 8px;
  }
</style>

// main.ts
const handleDelete = async (): Promise<void> => {
  const confirmed = await ChillAlert.confirm({
    title: "Delete item?",
    text: "This action cannot be undone"
  })

  if (confirmed) {
    ChillAlert.toast({ text: "Deleted!", type: "success" })
  }
}`
};
