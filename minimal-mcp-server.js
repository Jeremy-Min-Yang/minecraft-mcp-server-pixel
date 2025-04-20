// Minimal MCP server for Claude Desktop testing
process.stdin.setEncoding('utf8');

function send(obj) {
  const msg = JSON.stringify(obj) + '\n';
  process.stderr.write('[MCP OUT] ' + msg);
  process.stdout.write(msg);
}

function sendNotification(method, params = {}) {
  send({ jsonrpc: '2.0', method, params });
}

function sendManifest() {
  sendNotification('server/manifest', {
    id: 'echo',
    name: 'Echo MCP Server',
    description: 'A minimal MCP echo server for testing',
    version: '1.0.0',
    commands: [
      { id: 'echo', name: 'echo', description: 'Echo a message' }
    ]
  });
}

process.stdin.on('data', (chunk) => {
  chunk.split('\n').forEach(line => {
    if (!line.trim()) return;
    process.stderr.write('[MCP IN] ' + line + '\n');
    let msg;
    try {
      msg = JSON.parse(line);
    } catch (e) {
      send({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } });
      return;
    }
    if (msg.method === 'initialize') {
      send({
        jsonrpc: '2.0',
        id: msg.id,
        result: {
          protocolVersion: msg.params?.protocolVersion || '2024-11-05',
          capabilities: {},
          clientInfo: msg.params?.clientInfo
        }
      });
      sendNotification('server/ready', { message: 'Echo MCP server is ready.' });
      sendManifest();
    } else if (msg.method === 'echo') {
      send({ jsonrpc: '2.0', id: msg.id, result: { echoed: msg.params } });
    } else {
      send({ jsonrpc: '2.0', id: msg.id, error: { code: -32601, message: 'Unknown method' } });
    }
  });
});

process.stdin.on('end', () => {
  process.stderr.write('[MCP] stdin closed\n');
}); 