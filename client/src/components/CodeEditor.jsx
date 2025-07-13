import { useState } from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-c_cpp";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/theme-monokai";
// import "ace-builds/src-noconflict/ext-language_tools";

const CodeEditor = () => {
    const [selectedLanguage, setSelectedLanguage] = useState("javascript");
    const languageModes = {
        JavaScript: "javascript",
        Python: "python",
        "C++": "c_cpp"
    };

    return (
        <div className="web-ide-container">
            <div className="manage-editor">
                <select value={selectedLanguage} 
                    onChange={(e) => setSelectedLanguage(e.target.value)} 
                    title="Select lang"
                >
                    {Object.entries(languageModes).map(([label, value]) => (
                        <option key={value} value={value}>
                            {label}
                        </option>
                    ))}
                </select>

                <button>
                    Run Code
                </button>
            </div>
            <AceEditor
                height='100%'
                width='100%'
                theme="monokai"
                mode={selectedLanguage}
                setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    useWorker: false
                }}
            />
        </div>
    )
}

export default CodeEditor