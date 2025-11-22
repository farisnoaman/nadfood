#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('/workspace/shipment_tracking-0.0.1')

print("Attempting to build with Vite...")
print("="*50)

try:
    result = subprocess.run(
        ['npm', 'run', 'build'],
        capture_output=True,
        text=True,
        timeout=120
    )
    
    print("RETURN CODE:", result.returncode)
    print("\n--- STDOUT ---")
    print(result.stdout)
    print("\n--- STDERR ---")
    print(result.stderr)
    
    if result.returncode == 0:
        print("\n✅ Build succeeded!")
        # Check if dist folder exists
        if os.path.exists('dist/index.html'):
            print("✅ dist/index.html exists")
        else:
            print("❌ dist/index.html missing")
    else:
        print(f"\n❌ Build failed with code {result.returncode}")
        
except subprocess.TimeoutExpired:
    print("❌ Build timed out after 120 seconds")
except Exception as e:
    print(f"❌ Error: {e}")

sys.exit(0)
