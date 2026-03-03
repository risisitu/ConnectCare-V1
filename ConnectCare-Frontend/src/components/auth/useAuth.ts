import { useState, useEffect } from 'react';

export interface User {
    id: string;
    email: string;
    role: string;
    name?: string;
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const userStr = localStorage.getItem("user");
        if (userStr) {
            try {
                setUser(JSON.parse(userStr));
            } catch (e) {
                console.error("Failed to parse user from local storage", e);
            }
        }
    }, []);

    return { user };
}
