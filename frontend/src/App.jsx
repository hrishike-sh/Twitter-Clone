import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { Toaster } from "react-hot-toast";
import { useQuery } from "react-query";
import LoadingSpinner from "./components/common/LoadingSpinner";
function App() {
  const { data: authUser, isLoading } = useQuery(
    {
      queryKey: ["authUser"],
      queryFn: async () => {
        try {
          const res = await fetch("/api/auth/me");
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.message || data.error);
          }
          return data;
        } catch (e) {}
      }
    },
    {
      retry: false,
      retryOnMount: false
    }
  );

  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex max-w-6xl mx-auto">
      {authUser ? <Sidebar /> : null}
      <Routes>
        <Route
          path="/"
          element={authUser ? <HomePage /> : <Navigate to="/login" />}
        />
        <Route
          path="/login"
          element={authUser ? <Navigate to="/" /> : <LoginPage />}
        />
        <Route
          path="/signup"
          element={authUser ? <Navigate to="/" /> : <SignUpPage />}
        />
        <Route
          path="/notifications"
          element={authUser ? <NotificationPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile/:username"
          element={authUser ? <ProfilePage /> : <Navigate to="/login" />}
        />
      </Routes>
      {authUser ? <RightPanel /> : null}
      <Toaster />
    </div>
  );
}

export default App;
