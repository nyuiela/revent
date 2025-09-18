#!/bin/bash

# Install OpenZeppelin upgradeable contracts
echo "Installing OpenZeppelin upgradeable contracts..."

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed"
    exit 1
fi

# Create lib directory if it doesn't exist
mkdir -p lib

# Clone the upgradeable contracts
if [ ! -d "lib/openzeppelin-contracts-upgradeable" ]; then
    echo "Cloning openzeppelin-contracts-upgradeable..."
    git clone https://github.com/OpenZeppelin/openzeppelin-contracts-upgradeable.git lib/openzeppelin-contracts-upgradeable
else
    echo "openzeppelin-contracts-upgradeable already exists, updating..."
    cd lib/openzeppelin-contracts-upgradeable
    git pull
    cd ../..
fi

echo "Installation completed!"
echo "You can now compile the upgradeable contracts."
