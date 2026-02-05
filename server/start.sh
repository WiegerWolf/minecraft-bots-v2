#!/bin/bash
# Start Paper server with a specific world
# Usage: ./start.sh <world_name>
#
# Worlds are defined in worlds.json
# Each world instance lives in instance/<world_name>/

set -e
cd "$(dirname "$0")"

WORLD_NAME="${1:-forest}"

# Run setup if paper.jar is missing
if [ ! -f "paper.jar" ]; then
    echo "Paper not found, running setup..."
    ./setup.sh
fi

# Check if world exists in config
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required. Install with: sudo apt install jq"
    exit 1
fi

SEED=$(jq -r ".\"$WORLD_NAME\".seed // empty" worlds.json)
DESC=$(jq -r ".\"$WORLD_NAME\".description // empty" worlds.json)

if [ -z "$SEED" ]; then
    echo "Error: World '$WORLD_NAME' not found in worlds.json"
    echo ""
    echo "Available worlds:"
    jq -r 'to_entries[] | "  \(.key): \(.value.description)"' worlds.json
    exit 1
fi

INSTANCE_DIR="instance/$WORLD_NAME"
mkdir -p "$INSTANCE_DIR"

# Link paper.jar and plugins into instance
ln -sf "$(pwd)/paper.jar" "$INSTANCE_DIR/paper.jar"
ln -sf "$(pwd)/plugins" "$INSTANCE_DIR/plugins"

# Generate server.properties with the correct seed
sed "s/SEED_PLACEHOLDER/$SEED/g; s|level-name=world|level-name=world|g" config/server.properties > "$INSTANCE_DIR/server.properties"
cp config/eula.txt "$INSTANCE_DIR/eula.txt"

echo ""
echo "=== Starting Paper Server ==="
echo "  World: $WORLD_NAME"
echo "  Instance: $INSTANCE_DIR"
echo "  Seed: $SEED"
echo "  Description: $DESC"
echo "  Port: 25565"
echo "  RCON: 25575 (password: botdev)"
echo ""
echo "CoreProtect rollback command:"
echo "  /co rollback u:Lumberjack_* t:10m r:100"
echo ""

cd "$INSTANCE_DIR"
exec java -Xms512M -Xmx2G -jar paper.jar --nogui
