const http = require('http');
const express = require('express');
const { Server: SocketServer } = require('socket.io');
const fs = require('fs/promises'); //for filesystem
const filesys = require('fs'); //for filesystem
const path = require('path');
const cors = require('cors');
const chokidar = require('chokidar'); //watch file changes
const { spawn } = require('child_process');


const app = express();
const server = http.createServer(app);
const io = new SocketServer({
    cors: '*'
});

app.use(express.json());

// allow call from frontend using localhost
app.use(cors());

io.attach(server);


io.on('connection', (socket) => {
    console.log('socket conected', socket.id); 

    const userId = socket.handshake.query.userId;

    if (userId) {
        socket.join(userId); // Join room named after userId
        console.log(`Socket ${socket.id} joined room ${userId}`);
    }

    socket.on('disconnect', () => {
        console.log(`Socket ${socket.id} disconnected`);
    });
});

app.get('/files', async (req, res) => {
    const fileTree = await generateFileTree('./users');
    return res.json({
        tree: fileTree
    });
});

// watch changes in users folder
chokidar.watch('./users').on('all', (event, path) => {
  io.emit('file:refresh', path);
});

const port = process.env.PORT || 9000;
server.listen(port, () => {
    return console.log('docker running on port 9000');
});

app.post('/api/run-code', async (req, res) => {
    const { userId, userCode, selectedLanguage, userInput } = req.body;
    if (!userId || !userCode || !selectedLanguage) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    // create a folder named userId in users directory (if not created before)
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

    console.log("before")

    // run code in background
    runInDocker(userId, selectedLanguage, userInput, (output) => {
        console.log(output);
        // Emit result via socket
        io.to(userId).emit('execution-result', output);
    });

    console.log("after")

    // return status to show that code is running
    res.status(200).json({
        status: true,
        message: 'Code execution started in background',
    });
});

async function runInDocker(userId, lang, userInput, onOutput) {
    const userDir = path.join(__dirname, 'users', userId);

    let fileName, dockerImage, compileCmd, runCmd;

    switch (lang) {
        case 'cpp':
            fileName = 'main.cpp';
            dockerImage = 'gcc';
            compileCmd = `g++ ${fileName} -o main.out`;
            runCmd = `./main.out`;
            break;
        case 'python':
            fileName = 'main.py';
            dockerImage = 'python';
            runCmd = `python ${fileName}`;
            break;
        case 'javascript':
            fileName = 'main.js';
            dockerImage = 'node';
            runCmd = `node ${fileName}`;
            break;
        default:
            onOutput('Unsupported language.');
            return;
    }

    const volumeMount = `${userDir}:/app`;
    const containerCmd = compileCmd
        ? `sh -c "${compileCmd} && ${runCmd}"`
        : runCmd;

    const dockerArgs = [
        'run',
        '--rm',
        '-i', //for user input
        '-v', volumeMount,
        '-w', '/app',
        dockerImage,
        'sh', '-c', containerCmd
    ];

    const dockerProcess = spawn('docker', dockerArgs);

    // Send input to stdin of container
    if (userInput) {
        dockerProcess.stdin.write(userInput);
        dockerProcess.stdin.end();
    }

    let output = '';

    dockerProcess.stdout.on('data', (data) => {
        output += data.toString();
    });

    dockerProcess.stderr.on('data', (data) => {
        output += data.toString();
    });

    dockerProcess.on('close', (code) => {
        console.log("codeee-> " + code);
        console.log("outputtt-> " + output);
        onOutput(output.trim() || `Process exited with code ${code}`);
    });
}

async function generateFileTree(directory) {
    const tree = {};

    async function buildTree(currDir, currTree) {
        // gives list of files and folders
        const list = await fs.readdir(currDir);
        // console.log(list);

        // each item is a file or a folder
        for( const item of list) {
            const itemPath = path.join(currDir, item);

            // to know whether its a file or folder
            const stat = await fs.stat(itemPath);

            // folder
            if(stat.isDirectory()) {
                currTree[item] = {};
                // console.log(currTree);
                await buildTree(itemPath, currTree[item]);
            }
            // file
            else {
                currTree[item] = null;
                // console.log(currTree);
            }
        }
    }

    await buildTree(directory, tree);
    return tree;
}