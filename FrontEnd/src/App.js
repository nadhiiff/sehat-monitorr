import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/home';
import AboutUs from './pages/AboutUs';
import FormDownload from './pages/FormDownload';
import ReportBerhasil from './pages/ReportBerhasil';
import ReportForm from './pages/ReportForm';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/form-download" element={<FormDownload />} />
          <Route path="/report-berhasil" element={<ReportBerhasil />} />
          <Route path="/report-form" element={<ReportForm />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;