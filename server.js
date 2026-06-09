const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<!DOCTYPE html>
<html>
<head>
    <title>CCTV Live</title>
    <meta name="viewport" 
          content="width=device-width,initial-scale=1">
    <style>
        body{margin:0;background:#000;
        display:flex;flex-direction:column;
        align-items:center;}
        h2{color:#00ff00;font-family:sans-serif;
        margin:10px;}
        img{width:100%;max-width:640px;}
        #status{color:#ffff00;
        font-family:sans-serif;margin:5px;}
        .btn{padding:15px;font-size:18px;
        border:none;border-radius:10px;
        margin:8px;cursor:pointer;width:85%;}
        .torch-on{background:#FF6F00;color:#fff;}
        .torch-off{background:#388E3C;color:#fff;}
    </style>
</head>
<body>
    <h2>&#128247; CCTV Live Feed</h2>
    <img id="frame" />
    <p id="status">&#9203; Connecting...</p>
    <button id="torchBtn" class="btn torch-on"
        onclick="toggleTorch()">
        &#128294; Torch ON
    </button>
    <script>
        const ws = new WebSocket(
            'wss://' + location.host);
        const img = document.getElementById('frame');
        const status = document.getElementById('status');
        const btn = document.getElementById('torchBtn');
        let torchOn = false;

        ws.onopen = () => {
            status.textContent = '✅ Connected!';
            ws.send('viewer');
        };

        ws.onmessage = (e) => {
            img.src = 'data:image/jpeg;base64,'
                + e.data;
        };

        ws.onclose = () => {
            status.textContent = '❌ Disconnected!';
        };

        function toggleTorch() {
            torchOn = !torchOn;
            ws.send(torchOn ? 'torch_on' : 'torch_off');
            btn.textContent = torchOn
                ? '&#128294; Torch OFF'
                : '&#128294; Torch ON';
            btn.className = torchOn
                ? 'btn torch-off'
                : 'btn torch-on';
        }
    </script>
</body>
</html>`);
});

const wss = new WebSocket.Server({ server });
let cameraSocket = null;

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        const message = msg.toString();

        if (message === 'camera') {
            cameraSocket = ws;
            console.log('✅ Camera connected!');

        } else if (message === 'viewer') {
            console.log('✅ Viewer connected!');

        } else if (message === 'torch_on' ||
                   message === 'torch_off') {
            // Browser se torch command
            // Camera phone ko bhejo
            if (cameraSocket &&
                cameraSocket.readyState ===
                WebSocket.OPEN) {
                cameraSocket.send(message);
                console.log('🔦 Torch: ' + message);
            }

        } else {
            // Camera frame — viewers ko bhejo
            wss.clients.forEach(client => {
                if (client !== ws &&
                    client.readyState ===
                    WebSocket.OPEN) {
                    client.send(message);
                }
            });
        }
    });

    ws.on('close', () => {
        if (ws === cameraSocket) {
            cameraSocket = null;
            console.log('Camera disconnected');
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('🚀 Server running: ' + PORT);
});
