#!/bin/bash
cd /workspace/shipment_tracking-0.0.1
echo "Starting build..."
npm run build
echo "Build completed"
ls -la dist/ 2>&1 > /workspace/build_output.txt
echo "Output written to build_output.txt"
