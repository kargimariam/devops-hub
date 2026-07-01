/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type FC, type FormEvent } from "react";
import { BrowserRouter, Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  LayoutDashboard, 
  PlusCircle, 
  Activity, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  ArrowLeft
} from "lucide-react";

// --- Types ---
interface Project {
  id: string;
  name: string;
  status: string;
  description: string;
}

interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
}

// --- Components ---

const Navbar = () => (
  <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-10">
    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600">
        <LayoutDashboard id="logo-icon" className="w-6 h-6" />
        <span>DevOps Hub</span>
      </Link>
      <div className="flex gap-6 items-center">
        <Link to="/" className="text-gray-600 hover:text-blue-600 transition-colors">Projects</Link>
        <Link to="/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors shadow-sm">
          <PlusCircle className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>
    </div>
  </nav>
);

const ProjectCard: FC<{ project: Project }> = ({ project }) => (
  <motion.div 
    layout
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="font-semibold text-lg text-gray-900">{project.name}</h3>
      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
        project.status === "Active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
      }`}>
        {project.status === "Active" ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
        {project.status}
      </span>
    </div>
    <p className="text-gray-600 text-sm mb-6 line-clamp-2">{project.description}</p>
    <Link 
      to={`/project/${project.id}`} 
      className="text-blue-600 text-sm font-medium flex items-center gap-1 hover:underline"
    >
      View Details <ExternalLink className="w-3 h-3" />
    </Link>
  </motion.div>
);

const Dashboard = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [health, setHealth] = useState<HealthStatus | null>(null);

  useEffect(() => {
    fetch("/api/projects").then(res => res.json()).then(setProjects);
    
    // Initial health check
    fetch("/api/health").then(res => res.json()).then(setHealth);
    
    // Poll health every 10 seconds (for monitoring requirement demo)
    const interval = setInterval(() => {
      fetch("/api/health").then(res => res.json()).then(setHealth);
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Health Indicator (Monitoring Requirement) */}
      <div className="mb-12 bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white p-2 rounded-lg shadow-sm">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-blue-900">System Monitoring</h4>
            <p className="text-xs text-blue-600">Continuous health check active</p>
          </div>
        </div>
        <div className="text-right">
          <span className="flex items-center gap-2 text-sm font-medium text-blue-900">
            Status: <span className="text-green-600 capitalize">{health?.status || "Connecting..."}</span>
          </span>
          <p className="text-[10px] text-blue-500 font-mono">Last check: {health?.timestamp || "N/A"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

const ProjectDetails = () => {
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${id}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(setProject)
      .catch(() => setError(true));
  }, [id]);

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="w-12 h-12 text-red-500" />
      <h2 className="text-xl font-bold">Project Not Found</h2>
      <Link to="/" className="text-blue-600 hover:underline">Return to Dashboard</Link>
    </div>
  );

  if (!project) return <div className="p-24 text-center">Loading project data...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <Link to="/" className="flex items-center gap-2 text-gray-500 mb-8 hover:text-blue-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to projects
      </Link>
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-white border border-gray-200 rounded-2xl p-10 shadow-sm"
      >
        <h1 className="text-3xl font-bold mb-4">{project.name}</h1>
        <div className="bg-gray-50 p-6 rounded-xl mb-8">
          <h3 className="font-semibold text-gray-900 mb-2">Project Overview</h3>
          <p className="text-gray-600 leading-relaxed">{project.description}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 border border-gray-100 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Status</p>
            <p className="font-medium">{project.status}</p>
          </div>
          <div className="p-4 border border-gray-100 rounded-lg">
            <p className="text-xs text-gray-400 mb-1">Project ID</p>
            <p className="font-mono text-sm">{project.id}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

const NewProjectForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ name: "", description: "", status: "Pending" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (res.ok) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
      >
        <h2 className="text-2xl font-bold mb-6">Register New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name</label>
            <input 
              required
              id="project-name"
              type="text" 
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              required
              id="project-desc"
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            ></textarea>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? "Creating Project..." : "Deploy Project"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/project/:id" element={<ProjectDetails />} />
            <Route path="/new" element={<NewProjectForm />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
