import { useState } from 'react';
import './App.css';
import FileTree from './components/filetree';
import Terminal from './components/terminal';
import { useEffect } from 'react';
import socket from './socket';
import CodeEditor from './components/CodeEditor';

function App() {

  const [tree, setTree] = useState({});

  useEffect(() => {
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

  return (
    <div className='playground-container'>
      <div className='editor-container'>
        <div className="files">
          <FileTree tree={tree} />
        </div>
        <div className="editor">
          <CodeEditor/>
        </div>
      </div>
      <div className='terminal-container'>
        <Terminal/>
      </div>
    </div>
  )
}

export default App
