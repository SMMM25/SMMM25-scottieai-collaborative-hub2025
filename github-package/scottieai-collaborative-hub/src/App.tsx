import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { RecommendationProvider } from './contexts/RecommendationContext';

// Layouts
import { MainLayout } from './layouts/MainLayout';

// Pages
import { Index } from './pages/Index';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { UploadPage } from './pages/UploadPage';
import AIRecommendationsPage from './pages/AIRecommendationsPage';

// Components
import { LoadingScreen } from './components/ui/loading-screen';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <RecommendationProvider>
        <Router>
          <Toaster position="top-right" />
          <React.Suspense fallback={<LoadingScreen />}>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Index />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route path="projects" element={<ProjectsPage />} />
                <Route path="upload" element={<UploadPage />} />
                <Route path="ai-recommendations" element={<AIRecommendationsPage />} />
              </Route>
            </Routes>
          </React.Suspense>
        </Router>
      </RecommendationProvider>
    </AuthProvider>
  );
};

export default App;
