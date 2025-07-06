import { Terminal as XTerminal } from '@xterm/xterm';
import { useEffect } from 'react';
import { useRef } from 'react';
import socket from '../socket';
import '@xterm/xterm/css/xterm.css'

const Terminal = () => {
    const terminalRef = useRef();
    const isRendered = useRef(false); //prevent loading terminal twice
    
    useEffect(() => {
        if(isRendered.current)  return;

        isRendered.current = true;
        const terminal = new XTerminal({
            rows: 20,
        });
        terminal.open(terminalRef.current);

        // event listener triggered when a user types something on terminal
        terminal.onData(data => {
            // socket sends data on 'terminal:write' event to backend
            socket.emit('terminal:write', data);
            console.log(data);
        });

        socket.on('terminal:data', (data) => {
            terminal.write(data);
        });

    //    return () => {
    //     socket.off('terminal:data');
    //    }
    }, []);
    

    return (
        <div ref={terminalRef} id='customTerminal'>
        </div>
    )
}

export default Terminal;