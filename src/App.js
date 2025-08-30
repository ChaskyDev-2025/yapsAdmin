import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import DocumentRepoProvider from "./context/DocumentRepoProvider";

import Login        from "./pages/Login";
import StartupPage  from "./pages/StartupPage";
import AdminRoutes  from "./routes/AdminRoutes";
import LandingPage  from "./pages/landing/LandingPage";

// 👇 importa AuthProvider + ProtectedRoute
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute   from "./auth/ProtectedRoute";

const App = () => (
  <DocumentRepoProvider>
    <AuthProvider> {/* 👈 expone user/loading a todo */}
      <Router>
        <Routes>
          <Route path="/"        element={<StartupPage />} />
          <Route path="/login"   element={<Login />} />
          <Route path="/landing" element={<LandingPage />} />

          {/* 👇 protege TODO lo que esté bajo /admin/* */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin/*" element={<AdminRoutes />} />
          </Route>

          {/* fallback opcional */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  </DocumentRepoProvider>
);

export default App;
