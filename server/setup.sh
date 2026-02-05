#!/bin/bash
# Setup Paper server for bot development
# Downloads Paper and CoreProtect plugin

set -e
cd "$(dirname "$0")"

PAPER_VERSION="1.21.6"

echo "=== Paper Server Setup ==="
echo ""

# Download Paper if not present
if [ ! -f "paper.jar" ]; then
    echo "Downloading Paper $PAPER_VERSION..."

    # Get latest build number
    BUILD=$(curl -s "https://api.papermc.io/v2/projects/paper/versions/$PAPER_VERSION/builds" | grep -o '"build":[0-9]*' | tail -1 | grep -o '[0-9]*')

    if [ -z "$BUILD" ]; then
        echo "Error: Could not fetch Paper build info"
        exit 1
    fi

    echo "Latest build: $BUILD"
    curl -L -o paper.jar "https://api.papermc.io/v2/projects/paper/versions/$PAPER_VERSION/builds/$BUILD/downloads/paper-$PAPER_VERSION-$BUILD.jar"
    echo "Downloaded paper.jar"
else
    echo "paper.jar already exists, skipping download"
fi

# Download CoreProtect if not present
mkdir -p plugins
if [ ! -f "plugins/CoreProtect.jar" ]; then
    echo "Downloading CoreProtect..."
    curl -L -o plugins/CoreProtect.jar "https://cdn.modrinth.com/data/Lu3KuzdV/versions/anOhDobp/CoreProtect-CE-23.0.jar"
    echo "Downloaded CoreProtect.jar"
else
    echo "CoreProtect.jar already exists, skipping download"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Usage: ./start.sh <world_name>"
echo "Available worlds are defined in worlds.json"
echo ""
echo "Example: ./start.sh forest"
