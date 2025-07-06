const http = require('http');
const express = require('express');
const { Server: SocketServer } = require('socket.io');
const pty = require('node-pty');
const fs = require('fs/promises'); //for filesystem
const path = require('path');
const cors = require('cors');
const chokidar = require('chokidar'); //watch file changes
var os = require('os');

var shell = os.platform() === 'win32' ? 'powershell.exe' : 'bash';
const ptyProcess = pty.spawn(shell, [], {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    cwd: process.env.INIT_CWD + '/user',
    env: process.env
});

const app = express();
const server = http.createServer(app);
const io = new SocketServer({
    cors: '*'
});

// allow call from frontend using localhost
app.use(cors());

io.attach(server);

// emit data from backend to frontend terminal
ptyProcess.onData(data => {
    io.emit('terminal:data', data);
})

io.on('connection', (socket) => {
    console.log('socket conected', socket.id); 

    // request from frontend using socket
    socket.on('terminal:write', (data) => {
        ptyProcess.write(data);
    });
});

app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./user');
    return res.json({
        tree: fileTree
    });
});

// watch changes in user folder
chokidar.watch('./user').on('all', (event, path) => {
  io.emit('file:refresh', path);
});

server.listen(9000, () => {
    return console.log('docker running on port 9000');
});

async function generateFileTree(directory) {
    const tree = {};

    async function buildTree(currDir, currTree) {
        // gives list of files and folders
        const list = await fs.readdir(currDir);
        console.log(list);

        // each item is a file or a folder
        for( const item of list) {
            const itemPath = path.join(currDir, item);

            // to know whether its a file or folder
            const stat = await fs.stat(itemPath);

            // folder
            if(stat.isDirectory()) {
                currTree[item] = {};
                console.log(currTree);
                await buildTree(itemPath, currTree[item]);
            }
            // file
            else {
                currTree[item] = null;
                console.log(currTree);
            }
        }
    }

    await buildTree(directory, tree);
    return tree;
}