import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {DashboardLayout} from './components/layout/DashboardLayout';
import {Login} from './pages/Login';
import {Opportunities} from './pages/seo/Opportunities';
import {Tracking} from './pages/seo/Tracking';
import {Subscribers} from './pages/email/Subscribers';
import {Templates} from './pages/email/Templates';
import {Editor} from './pages/email/Editor';
import {Campaigns} from './pages/email/Campaigns';
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
                  <Route
                    path="/"
                    element={<Navigate to="/seo/tracking" replace />}
                  />
                  <Route path="/seo/tracking" element={<Tracking />} />
                  <Route
                    path="/seo/opportunities"
                    element={<Opportunities />}
                  />
                  <Route path="/email/subscribers" element={<Subscribers />} />
                  <Route path="/email/templates" element={<Templates />} />
                  <Route path="/email/templates/new" element={<Editor />} />
                  <Route path="/email/templates/:id" element={<Editor />} />
                  <Route path="/email/campaigns" element={<Campaigns />} />
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
