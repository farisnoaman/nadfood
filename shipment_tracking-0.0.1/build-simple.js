// Simple build script to create a working deployment
const fs = require('fs');
const path = require('path');

// Read environment variables
const env = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://kjvzhzbxspgvvmktjwdi.supabase.co',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjYyMTQsImV4cCI6MjA3ODIwMjIxNH0.xc1wMNg_q23ZbNhUm6oyKbUw_298y0xG9B8YBU6j2VI'
};

// Create dist-build directory
const distDir = path.join(__dirname, 'dist-build');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy static files
const staticFiles = ['manifest.json', 'sw.js'];
staticFiles.forEach(file => {
  if (fs.existsSync(file)) {
    fs.copyFileSync(file, path.join(distDir, file));
    console.log(`Copied ${file}`);
  }
});

// Create HTML with environment variables injected
const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>العسكري للنقل</title>
    <link rel="manifest" href="/manifest.json">
    
    <!-- Inject environment variables -->
    <script>
      window.ENV = {
        VITE_SUPABASE_URL: "${env.VITE_SUPABASE_URL}",
        VITE_SUPABASE_ANON_KEY: "${env.VITE_SUPABASE_ANON_KEY}"
      };
    </script>
    
    <!-- PWA install event -->
    <script>
      window.deferredPrompt = null;
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        window.deferredPrompt = e;
      });
    </script>

    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            colors: {
              primary: {"50":"#eff6ff","100":"#dbeafe","200":"#bfdbfe","300":"#93c5fd","400":"#60a5fa","500":"#3b82f6","600":"#2563eb","700":"#1d4ed8","800":"#1e40af","900":"#1e3a8a","950":"#172554"},
              secondary: {"50":"#f8fafc","100":"#f1f5f9","200":"#e2e8f0","300":"#cbd5e1","400":"#94a3b8","500":"#64748b","600":"#475569","700":"#334155","800":"#1e293b","900":"#0f172a","950":"#020617"}
            },
            keyframes: {
              'slide-in-up': {
                'from': { transform: 'translateY(100%)' },
                'to': { transform: 'translateY(0)' },
              },
            },
            animation: {
              'slide-in-up': 'slide-in-up 0.3s ease-out',
            },
          }
        }
      }
    </script>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
      body {
        font-family: 'Cairo', sans-serif;
        -webkit-tap-highlight-color: transparent;
      }
    </style>
  <script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.2.0",
    "react/": "https://esm.sh/react@18.2.0/",
    "react/jsx-runtime": "https://esm.sh/react@18.2.0/jsx-runtime",
    "react/jsx-dev-runtime": "https://esm.sh/react@18.2.0/jsx-dev-runtime",
    "react-dom": "https://esm.sh/react-dom@18.2.0",
    "react-dom/": "https://esm.sh/react-dom@18.2.0/",
    "react-dom/client": "https://esm.sh/react-dom@18.2.0/client",
    "react-router-dom": "https://esm.sh/react-router-dom@6.22.3?external=react",
    "lucide-react": "https://esm.sh/lucide-react@0.378.0?external=react",
    "jspdf": "https://esm.sh/jspdf@2.5.1",
    "html2canvas": "https://esm.sh/html2canvas@1.4.1",
    "@supabase/supabase-js": "https://esm.sh/@supabase/supabase-js@2"
  }
}
</script>
</head>
  <body>
    <div id="root"></div>
    <script type="module" src="/bundle.js"></script>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, 'index.html'), html);
console.log('Created index.html with environment variables');
console.log('Build directory created at: dist-build');
