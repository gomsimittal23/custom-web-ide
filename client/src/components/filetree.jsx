//fileName - object key
//fileNode - object
const FileTreeNode = ({ fileName, fileNode }) => {
    const isDir = !!fileNode;

    return (
        <div style={{ marginLeft: '10px' }}>
            <p className={isDir ? '' : 'file-node'}>
                {fileName}
            </p>
            {
                fileNode && 
                <ul>
                    {
                        Object.keys(fileNode).map(child => (
                            <li key={child}>
                                <FileTreeNode
                                    fileName={child}
                                    fileNode={fileNode[child]}
                                />
                            </li>
                        ))
                    }
                </ul>
            }
        </div>
    )
}

const FileTree = ({tree}) => {
  return (
    <FileTreeNode
        fileName={'/'}
        fileNode={tree}
    />
  )
}

export default FileTree;