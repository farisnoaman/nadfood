#!/usr/bin/env python3
import subprocess
import os
import shutil

# Change to project directory
os.chdir('/workspace/shipment_tracking-0.0.1')

print("=== Building app with Vite ===")
result = subprocess.run(['npm', 'run', 'build'], capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)

# Copy manifest and service worker to dist
print("\n=== Copying PWA files to dist ===")
shutil.copy('manifest.json', 'dist/manifest.json')
print("✓ Copied manifest.json")

shutil.copy('sw.js', 'dist/sw.js')
print("✓ Copied sw.js")

# Check if icon files exist and copy them
if os.path.exists('vite.svg'):
    shutil.copy('vite.svg', 'dist/vite.svg')
    print("✓ Copied vite.svg")

print("\n=== Dist folder contents ===")
for root, dirs, files in os.walk('dist'):
    level = root.replace('dist', '').count(os.sep)
    indent = ' ' * 2 * level
    print(f'{indent}{os.path.basename(root)}/')
    subindent = ' ' * 2 * (level + 1)
    for file in files[:20]:  # Limit to first 20 files per directory
        print(f'{subindent}{file}')
