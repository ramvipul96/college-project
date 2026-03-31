import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const NotFound = () => (
  <div className="not-found-page">
    <h1>404</h1>
    <p>The page you're looking for doesn't exist or has been moved.</p>
    <Link to="/" className="btn btn-primary"><ArrowLeft size={16} />Back to Dashboard</Link>
  </div>
);

export default NotFound;
