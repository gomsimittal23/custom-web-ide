const http = require('http');
const express = require('express');
const { Server: SocketServer } = require('socket.io');
const pty = require('node-pty');
const fs = require('fs/promises'); //for filesystem
const filesys = require('fs'); //for filesystem
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

app.use(express.json());

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

app.post('/api/run-code', async (req, res) => {
    const { userId, userCode, selectedLanguage } = req.body;
    if (!userId || !userCode || !selectedLanguage) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // create a folder named userId in user directory (if not created before)
    const userDir = path.join(__dirname, 'users', userId);
    if (!filesys.existsSync(userDir)) {
        filesys.mkdirSync(userDir, { recursive: true });
    }

    const langToExtension = {
        python: 'py',
        javascript: 'js',
        cpp: 'cpp'
    };

    const fileExt = langToExtension[selectedLanguage];
    if (!fileExt) {
        return res.status(400).json({ error: 'Unsupported language' });
    }
    // create a file named userId.language in userId folder (if not created before)
    const filePath = path.join(userDir, `main.${fileExt}`);
    filesys.writeFileSync(filePath, userCode);

    // run code in background
    runInDocker(userId, selectedLanguage, (output) => {
        // Emit result via socket
        io.to(userId).emit('execution-result', output);
    });

    // return status to show that code is running
    res.status(200).json({
        status: true,
        message: 'Code execution started in background',
    });
});

function runInDocker(userId, lang, output) {
    console.log(userId);
}

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