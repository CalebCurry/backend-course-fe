import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/Context';

const MenuBar = () => {

  const { isLoggedIn, logout } = useContext(AuthContext);

    return (
        <div className="menuBar">
            <div className="left">
                <Link to="/" className="link">Home</Link>
                { isLoggedIn ? <Link to="/protected" className="link">Protected</Link> : <></> }
            </div>
            <div className="right">
                { isLoggedIn ? <button onClick={logout} className="button">Logout</button> : <></> }
            </div>
        </div>
    );
};

export default MenuBar;