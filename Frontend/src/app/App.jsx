import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeContext } from "@/context/ThemeContext";
import { useLocalTheme } from "@/hooks/useLocalTheme";
import { AppRouter } from "@/routes/AppRouter";

function AppContent() {
  const theme = useLocalTheme();

  return (
    <ThemeContext.Provider value={theme}>
      <AppRouter />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(15, 23, 42, 0.92)",
            color: "#e2e8f0",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(12px)",
          },
        }}
      />
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
