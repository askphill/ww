import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {DashboardLayout} from './components/layout/DashboardLayout';
import {Login} from './pages/Login';
import {Overview} from './pages/seo/Overview';
import {Klaviyo} from './pages/Klaviyo';
import {Meta} from './pages/Meta';
import {useAuth} from './hooks/useAuth';

function ProtectedRoute({children}: {children: React.ReactNode}) {
  const {user, isLoading} = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route path="/" element={<Navigate to="/seo" replace />} />
                  <Route path="/seo" element={<Overview />} />
                  <Route path="/klaviyo" element={<Klaviyo />} />
                  <Route path="/meta" element={<Meta />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
