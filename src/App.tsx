import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes/AppRoutes';
import { AuthProvider } from './contexts/AuthContext';
import { LeadsProvider } from './contexts/LeadsContext'; // Import LeadsProvider

function App() {
  return (
    <AuthProvider>
      <LeadsProvider> {/* Wrap with LeadsProvider */}
        <Router>
          <Toaster
            position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#FFFFFF',
              color: '#1F2937',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '0.375rem',
              padding: '0.75rem 1rem',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        <AppRoutes />
        
        </Router>
      </LeadsProvider> {/* Close LeadsProvider */}
    </AuthProvider>
  );
}

export default App;