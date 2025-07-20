import { useState } from 'react';
import './App.css';
import FileTree from './components/filetree';
import Terminal from './components/terminal';
import { useEffect } from 'react';
import socket from './socket';
import CodeEditor from './components/CodeEditor';

function App() {

  const [tree, setTree] = useState({});
  const [userId, setUserId] = useState(null);
  const [userInput, setUserInput] = useState('');

  useEffect(() => {
    // get user id from localstorage or create it
    const id = getOrCreateUserId();
    setUserId(id);

    // set userId in socket and connect
    socket.io.opts.query = { userId: id };
    socket.connect();

    getFileTree();
  }, []);

  useEffect(() => {
    socket.on('file:refresh', getFileTree);
  
    return () => {
      socket.off('file:refresh', getFileTree);
    }
  }, []);
  

  const getFileTree = async () => {
    const response = await fetch('http://localhost:9000/files');
    const result = await response.json();

    setTree(result.tree);
  };

  function getOrCreateUserId() {
    let id = localStorage.getItem('user_id');
    if (!id) {
      const timestamp = Date.now().toString(36);       // e.g., "lnb6t5"
      const random = Math.random().toString(36).slice(2, 6); // e.g., "x8f2"
      id = 'user_' + timestamp + random; // e.g., "user_lnb6t5x8f2"
      localStorage.setItem('user_id', id);
    }
    return id;
  }

  return (
    <div className='playground-container'>
      <div className='editor-container'>
        <div className="files">
          <FileTree tree={tree} />
        </div>
        <div className="editor">
          <CodeEditor userId={userId} inputReceived={userInput} />
        </div>
      </div>
      <div className='terminal-container'>
        <Terminal onUserInputSend={setUserInput} />
      </div>
    </div>
  )
}

export default App
