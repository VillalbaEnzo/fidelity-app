import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import AdminScanner from './pages/AdminScanner';

const PrivateRoute = ({ children, role }) => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('role');
    if (!token) return <Navigate to="/" />;
    if (role && userRole !== role) return <Navigate to="/" />;
    return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/user" element={
          <PrivateRoute role="user"><UserDashboard /></PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute role="admin"><AdminScanner /></PrivateRoute>
        } />
      </Routes>
    </BrowserRouter>
  );
}
export default App;