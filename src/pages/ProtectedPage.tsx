import { useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/Context';

const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function ProtectedContent() {
  const { tokenInfo } = useContext(AuthContext);

  const handleProtectedAction = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/files`);
      console.log('Protected action response:', response.data);
    } catch (error) {
      console.error('Protected action failed', error);
    }
  };

  return (
    <div>
      <div>
        <h3>Access Token:</h3>
        <pre>...{tokenInfo?.access?.substring(210)}</pre>
      </div>
      <div>
        <h3>Refresh Token:</h3>
        <pre>...{tokenInfo?.refresh?.substring(210)}</pre>
      </div>
      <button onClick={handleProtectedAction}>Protected Action</button>
    </div>
  );
}