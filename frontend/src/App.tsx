import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import Nav from "./components/Nav";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Scan from "./pages/Scan";
import MapPage from "./pages/MapPage";
import Redistribute from "./pages/Redistribute";
import ChatWidget from "./components/ChatWidget";

function ScrollTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (!hash) window.scrollTo({ top: 0 });
    else setTimeout(() => document.querySelector(hash)?.scrollIntoView({ behavior: "smooth" }), 60);
  }, [pathname, hash]);
  return null;
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <ScrollTop />
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/redistribute" element={<Redistribute />} />
          <Route path="/dashboard" element={<Navigate to="/map" replace />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <ChatWidget />
    </div>
  );
}
