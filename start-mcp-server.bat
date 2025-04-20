@echo off
echo Starting Minecraft MCP Server... 1>&2
cd /d "%~dp0"
node src/index.js --host localhost --port 25565 --username ClaudeBot 