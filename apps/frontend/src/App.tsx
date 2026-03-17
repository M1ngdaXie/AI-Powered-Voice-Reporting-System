import { BrowserRouter, Routes, Route } from "react-router-dom";
import RecordPage from "./pages/RecordPage";
import ReportPage from "./pages/ReportPage";
import ManagerListPage from "./pages/ManagerListPage";
import ManagerDetailPage from "./pages/ManagerDetailPage";
import FeedbackPage from "./pages/FeedbackPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RecordPage />} />
        <Route path="/report" element={<ReportPage />} />
        <Route path="/manager" element={<ManagerListPage />} />
        <Route path="/manager/:id" element={<ManagerDetailPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}
