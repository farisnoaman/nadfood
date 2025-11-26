#!/usr/bin/env python3
import subprocess
import os

os.chdir('/workspace/shipment_tracking-0.0.1')

print("Building application...")
result = subprocess.run(['npx', 'vite', 'build'], capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)

if result.returncode == 0:
    print("\n✓ Build successful!")
else:
    print("\n✗ Build failed!")
    exit(1)
