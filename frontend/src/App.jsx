import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import Home from "./pages/public/Home";
import Login from "./pages/public/Login";
import Booking from "./pages/public/Booking";
import TrackAppointment from "./pages/public/TrackAppointment";

import Dashboard from "./pages/dashboard/Dashboard";
import Customers from "./pages/dashboard/Customers";
import Services from "./pages/dashboard/Services";
import Appointments from "./pages/dashboard/Appointments";
import Employees from "./pages/dashboard/Employees";
import Settings from "./pages/dashboard/Settings";

import ProtectedRoute from "./components/layout/ProtectedRoute";
import DashboardLayout from "./components/layout/DashboardLayout";

import { AuthProvider } from "./context/AuthContext";


function App() {
  return (
    <BrowserRouter>

      <AuthProvider>

        <Routes>

          {/* PUBLIC */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/book/:slug"
            element={<Booking />}
          />

          <Route
            path="/track/:appointmentId"
            element={<TrackAppointment />}
          />


          {/* DASHBOARD */}

          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/customers"
              element={<Customers />}
            />

            <Route
              path="/services"
              element={<Services />}
            />

            <Route
              path="/appointments"
              element={<Appointments />}
            />

            <Route
              path="/employees"
              element={<Employees />}
            />

            <Route
              path="/settings"
              element={<Settings />}
            />

          </Route>

        </Routes>

      </AuthProvider>

    </BrowserRouter>
  );
}


export default App;