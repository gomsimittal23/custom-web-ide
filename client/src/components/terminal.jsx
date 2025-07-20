import { useEffect } from 'react';
import { useRef } from 'react';
import socket from '../socket';
import { useState } from 'react';

const Terminal = ({ onUserInputSend }) => {
    const isRendered = useRef(false); //prevent loading component twice
    const [codeOutput, setCodeOutput] = useState('');
    
    useEffect(() => {
        if(isRendered.current)  return;

        isRendered.current = true;

        socket.on('execution-result', (output) => {
            console.log("plokjhbv->> " + output);
            setCodeOutput(output);
        });

        // return () => socket.off('execution-result');
    }, []);
    

    return (
        <div className='input-output-div'>
            <div className="input-container">
                <h3>Input</h3>
                <textarea
                    name="user-input"
                    id="user-input"
                    placeholder='(Optional) Enter terminal input'
                    onChange={(e) => onUserInputSend(e.target.value)}
                >
                </textarea>
            </div>
            <div className="output-container">
                <h3>Output</h3>
                <textarea
                    name="user-output"
                    id="user-output"
                    // placeholder=''
                    disabled
                    value={codeOutput}
                >
                </textarea>
            </div>
        </div>
    )
}

export default Terminal;