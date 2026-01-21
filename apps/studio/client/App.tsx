import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {DashboardLayout} from './components/layout/DashboardLayout';
import {Login} from './pages/Login';
import {Opportunities} from './pages/seo/Opportunities';
import {Tracking} from './pages/seo/Tracking';
import {Klaviyo} from './pages/Klaviyo';
import {Meta} from './pages/Meta';
import {Builder} from './pages/email/Builder';
import {Templates} from './pages/email/Templates';
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
                  <Route
                    path="/"
                    element={<Navigate to="/seo/tracking" replace />}
                  />
                  <Route path="/seo/tracking" element={<Tracking />} />
                  <Route
                    path="/seo/opportunities"
                    element={<Opportunities />}
                  />
                  <Route path="/klaviyo" element={<Klaviyo />} />
                  <Route path="/meta" element={<Meta />} />
                  <Route path="/email/builder" element={<Builder />} />
                  <Route path="/email/builder/:id" element={<Builder />} />
                  <Route path="/email/templates" element={<Templates />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
