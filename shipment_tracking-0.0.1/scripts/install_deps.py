#!/usr/bin/env python3
import subprocess
import os

os.chdir('/workspace/shipment_tracking-0.0.1')

print("Installing dependencies...")
print("="*50)

try:
    result = subprocess.run(
        ['npm', 'install'],
        capture_output=True,
        text=True,
        timeout=300
    )
    
    print("RETURN CODE:", result.returncode)
    print("\n--- LAST 50 LINES OF OUTPUT ---")
    lines = (result.stdout + result.stderr).split('\n')
    for line in lines[-50:]:
        print(line)
        
    if result.returncode == 0:
        print("\n✅ Install succeeded!")
    else:
        print(f"\n❌ Install failed with code {result.returncode}")
        
except Exception as e:
    print(f"❌ Error: {e}")
