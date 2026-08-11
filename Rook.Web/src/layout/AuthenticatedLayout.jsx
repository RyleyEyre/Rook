import { Outlet } from 'react-router-dom';
import NavBar from './NavBar';

function AuthenticatedLayout() {
    return (
        <>
            <NavBar />
            <Outlet />
        </>
    );
}

export default AuthenticatedLayout;