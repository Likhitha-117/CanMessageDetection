import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Valid roles for the platform
const VALID_ROLES = ['admin', 'owner', 'engineer'];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role');
        const fullName = localStorage.getItem('full_name');

        // Debug: Log the raw values from localStorage
        console.log('AuthContext Init - raw:', { token: !!token, role, fullName });

        // Robust validation: check if token and role exist AND role is valid
        // Also clear corrupted "undefined" strings from localStorage
        if (token && role && role !== "undefined" && role !== "null" && VALID_ROLES.includes(role)) {
            setUser({ token, role, full_name: fullName });
        } else if (token || role) {
            // Corrupted or partial data found, clear it
            console.warn('AuthContext: Corrupted or invalid session data found. Clearing localStorage.');
            localStorage.clear();
            setUser(null);
        }

        setLoading(false);
    }, []);

    const login = (data) => {
        console.log('AuthContext Login calling with:', data);

        // Ensure data is valid before setting state/storage
        if (!data || !data.access_token || !data.role) {
            console.error('AuthContext Login: Invalid data received from API', data);
            return;
        }

        localStorage.setItem('token', data.access_token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('full_name', data.full_name || 'User');

        const newUser = {
            token: data.access_token,
            role: data.role,
            full_name: data.full_name || 'User'
        };

        console.log('AuthContext Setting user state to:', newUser);
        setUser(newUser);
    };

    const logout = () => {
        console.log('AuthContext Logout');
        localStorage.clear();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
