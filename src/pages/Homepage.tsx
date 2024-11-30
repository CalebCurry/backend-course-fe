import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import { Link } from 'react-router-dom';
import { backendUrl } from '../shared';

const Homepage = () => {
    const { isLoggedIn } = useContext(AuthContext);
    
    const [files, setFiles] = useState([]);
    const [file, setFile] = useState(null);
    const [fileName, setFileName] = useState('');
    const [preview, setPreview] = useState(null);

    useEffect(() => {
        // Fetch files from the backend
        axios.get(backendUrl + '/api/files/')
            .then(response => setFiles(response.data.files))
            .catch(error => console.error('Error fetching files:', error));
    }, []);

    const handleFileChange = (event) => {
        const selectedFile = event.target.files[0];
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
    };

    const handleNameChange = (event) => {
        setFileName(event.target.value);
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('name', fileName);

        // Upload file to the backend
        axios.post(backendUrl + '/api/files/', formData)
            .then(response => {
                // Refresh the files list
                setFiles([...files, response.data]);
                setPreview(null); // Clear the preview after upload
            })
            .catch(error => console.error('Error uploading file:', error));
    };

    if (isLoggedIn) {
        return (
            <div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', margin: 'auto' }}>
                    <input type="file" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
                    <input type="text" placeholder="Enter file name" value={fileName} onChange={handleNameChange} style={{ marginBottom: '10px' }} />
                    <button type="submit" style={{ padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Upload</button>
                </form>
                {preview && <img src={preview} alt="Preview" style={{ maxWidth: '100%', marginTop: '10px' }} />}
                <div>
                    {files ? files.map((file, index) => (
                        <div key={index}>
                            <a href={backendUrl + file.file} download>{file.name}</a>
                            <img src={backendUrl + file.file} alt={file.name} style={{ maxWidth: '100px', display: 'block', marginTop: '10px' }} />
                        </div>
                    )): ''}
                </div>
            </div>
        );
    } else {
        return <div>Please <Link to="/login">login</Link> to upload files.</div>
    }
};

export default Homepage;