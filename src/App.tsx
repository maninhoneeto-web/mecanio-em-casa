/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from "react-router";
import Welcome from "./pages/Welcome";
import ClientMap from "./pages/ClientMap";
import Radar from "./pages/Radar";
import { AuthProvider } from "./contexts/AuthContext";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Welcome />} />
          <Route path="/mapa" element={<ClientMap />} />
          <Route path="/radar" element={<Radar />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
