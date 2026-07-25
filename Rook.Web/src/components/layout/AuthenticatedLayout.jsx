import { Outlet } from 'react-router-dom';
import NavBar from '../navigation/NavBar';

function AuthenticatedLayout() {
    return (
        <>
            <NavBar />
            <Outlet />
        </>
    );
}

export default AuthenticatedLayout;