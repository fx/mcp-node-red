#!/bin/bash

# Trust the mise configuration if it exists
if [ -f /workspace/mise.toml ]; then
    mise trust /workspace/mise.toml
    mise install
fi

# Install project dependencies if package.json exists
if [ -f package.json ]; then
    npm install
fi

# Repository-specific customizations can be added below
# Use these markers to preserve custom content during template updates:
# TEMPLATE:CUSTOM:START
# (Your custom commands here will be preserved during template updates)
# TEMPLATE:CUSTOM:END
