const http = require('http');
const WebSocket = require('ws');

const server = http.createServer((req, res) => {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(`<!DOCTYPE html>
<html>
<head>
    <title>CCTV Live</title>
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
        body{margin:0;background:#000;display:flex;
        flex-direction:column;align-items:center;}
        h2{color:#00ff00;font-family:sans-serif;}
        img{width:100%;max-width:640px;}
        p{color:#ffff00;font-family:sans-serif;}
        #status{color:#ff4444;}
    </style>
</head>
<body>
    <h2>📷 CCTV Live Feed</h2>
    <img id="frame" src="" />
    <p id="status">⏳ Camera ka wait kar raha hoon...</p>
    <script>
        const ws = new WebSocket('wss://' + location.host);
        const img = document.getElementById('frame');
        const status = document.getElementById('status');
        ws.onopen = () => {
            status.textContent = '✅ Connected!';
            ws.send('viewer');
        };
        ws.onmessage = (e) => {
            img.src = 'data:image/jpeg;base64,' + e.data;
        };
        ws.onclose = () => {
            status.textContent = '❌ Disconnected!';
        };
    </script>
</body>
</html>`);
});

const wss = new WebSocket.Server({ server });
let cameraSocket = null;

wss.on('connection', (ws) => {
    ws.on('message', (msg) => {
        if (msg.toString() === 'viewer') {
            console.log('Viewer connected');
        } else {
            // Camera se frame aaya — sab viewers ko bhejo
            wss.clients.forEach(client => {
                if (client !== ws &&
                    client.readyState === WebSocket.OPEN) {
                    client.send(msg.toString());
                }
            });
        }
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
