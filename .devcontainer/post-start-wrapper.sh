#!/bin/bash

# Create log file with timestamp
LOG_FILE="/tmp/post-start-$(date +%Y%m%d-%H%M%S).log"

echo "Starting post-start.sh at $(date)" > "$LOG_FILE"
echo "Environment:" >> "$LOG_FILE"
echo "USER=$USER" >> "$LOG_FILE"
echo "HOME=$HOME" >> "$LOG_FILE"
echo "PATH=$PATH" >> "$LOG_FILE"
echo "PWD=$PWD" >> "$LOG_FILE"
echo "which bash: $(which bash)" >> "$LOG_FILE"
echo "which npm: $(which npm 2>&1)" >> "$LOG_FILE"
echo "which node: $(which node 2>&1)" >> "$LOG_FILE"
echo "which mise: $(which mise 2>&1)" >> "$LOG_FILE"
echo "---" >> "$LOG_FILE"

# Run the actual post-start script and capture all output
echo "Running: bash .devcontainer/post-start.sh" >> "$LOG_FILE"
bash .devcontainer/post-start.sh >> "$LOG_FILE" 2>&1
EXIT_CODE=$?

echo "---" >> "$LOG_FILE"
echo "Exit code: $EXIT_CODE" >> "$LOG_FILE"
echo "Finished at $(date)" >> "$LOG_FILE"

# Also output to console
echo "Post-start script finished with exit code $EXIT_CODE"
echo "Log file: $LOG_FILE"

# Exit with the same code as the script
exit $EXIT_CODE