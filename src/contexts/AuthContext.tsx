import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types"; // Ensure this interface defines at least: id, name, role, etc.

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isBDA: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // ✅ loading state

  useEffect(() => {
    const storedUser = localStorage.getItem("crmUser");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false); // ✅ done loading from localStorage
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem("crmUser", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("crmUser");
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role?.toLowerCase() === "admin";
  const isBDA = user?.role?.toLowerCase() === "bda";

  if (loading) {
    // ✅ You can use a loading spinner here instead
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated,
        isAdmin,
        isBDA,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
