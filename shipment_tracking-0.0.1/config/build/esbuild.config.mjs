import esbuild from 'esbuild';
import fs from 'fs';
import path from 'path';

// Environment variables
const env = {
  'process.env.VITE_SUPABASE_URL': JSON.stringify('https://kjvzhzbxspgvvmktjwdi.supabase.co'),
  'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtqdnpoemJ4c3BndnZta3Rqd2RpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MjYyMTQsImV4cCI6MjA3ODIwMjIxNH0.xc1wMNg_q23ZbNhUm6oyKbUw_298y0xG9B8YBU6j2VI')
};

async function build() {
  try {
    // Create dist-build directory
    const distDir = path.join(process.cwd(), 'dist-build');
    if (fs.existsSync(distDir)) {
      fs.rmSync(distDir, { recursive: true });
    }
    fs.mkdirSync(distDir, { recursive: true });

    console.log('Building application with esbuild...');

    // Bundle the application
    await esbuild.build({
      entryPoints: ['index.tsx'],
      bundle: true,
      outfile: 'dist-build/bundle.js',
      format: 'esm',
      platform: 'browser',
      target: 'es2020',
      jsx: 'automatic',
      jsxImportSource: 'react',
      define: env,
      external: [
        'react',
        'react-dom',
        'react-dom/client',
        'react-router-dom',
        'lucide-react',
        'jspdf',
        'html2canvas',
        '@supabase/supabase-js'
      ],
      loader: {
        '.tsx': 'tsx',
        '.ts': 'ts',
        '.jsx': 'jsx',
        '.js': 'js'
      },
      minify: false,
      sourcemap: true
    });

    console.log('Bundle created successfully');

    // Copy static files
    const staticFiles = [
      { src: 'manifest.json', dest: 'manifest.json' },
      { src: 'sw.js', dest: 'sw.js' }
    ];

    staticFiles.forEach(({ src, dest }) => {
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, path.join(distDir, dest));
        console.log(`Copied ${src} to ${dest}`);
      }
    });

    // Create index.html
    const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>العسكري للنقل</title>
    <link rel="manifest" href="/manifest.json">
    
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
    console.log('Created index.html');
    
    console.log('\n✅ Build complete! Files are in dist-build/');
    console.log('Ready to deploy from dist-build directory');

  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

build();