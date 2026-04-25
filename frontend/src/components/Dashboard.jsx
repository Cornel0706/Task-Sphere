import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, Plus, CheckCircle2, Circle, Clock, 
  Trash2, Edit3, X, Tag 
} from 'lucide-react';

function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('Low');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
    setNewTitle('');
    setNewDescription('');
    setNewPriority('Low');
    setSelectedCategoryId('');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };
        const [tasksResponse, catsResponse] = await Promise.all([
          axios.get('http://127.0.0.1:8000/tasks/', { headers }),
          axios.get('http://127.0.0.1:8000/categories/', { headers })
        ]);
        setTasks(tasksResponse.data);
        setCategories(catsResponse.data); 
      } catch (err) {
        console.error("Fetch error:", err);
        if (err.response?.status === 401) handleLogout();
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchDashboardData();
    else navigate('/login');
  }, [token]);

  const handleSaveTask = async (e) => {
  e.preventDefault();
  try {
    const headers = { Authorization: `Bearer ${token}` };
    const taskData = {
      title: newTitle,
      description: newDescription,
      priority: newPriority,
      completed: editingTask ? editingTask.completed : false,
      category_id: selectedCategoryId ? parseInt(selectedCategoryId) : null
    };

    const selectedCat = categories.find(c => c.id === parseInt(selectedCategoryId));

    if (editingTask) {
      const response = await axios.put(`http://127.0.0.1:8000/tasks/${editingTask.id}`, taskData, { headers });

      const updatedTask = { ...response.data, category: selectedCat || null };
      
      setTasks(tasks.map(t => t.id === editingTask.id ? updatedTask : t));
    } else {
      const response = await axios.post('http://127.0.0.1:8000/tasks/', taskData, { headers });
      
      const newTask = { ...response.data, category: selectedCat || null };
      
      setTasks([newTask, ...tasks]);
    }
    
    closeAndResetModal();
  } catch (err) {
    console.error("Error saving task:", err);
  }
  };  

  const handleToggleComplete = async (task) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`http://127.0.0.1:8000/tasks/${task.id}`, updatedTask, { headers });
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
    } catch (err) {
      console.error("Error updating task:", err);
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm("Delete this task?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const openEditModal = (task) => {
    setEditingTask(task); 
    setNewTitle(task.title);
    setNewDescription(task.description || '');
    setNewPriority(task.priority);
    setSelectedCategoryId(task.category_id || '');
    setIsModalOpen(true);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault(); // ACUM FUNCTIONEAZA (am adaugat 'e')
    if (!newCatName.trim()) return;
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.post('http://127.0.0.1:8000/categories/', { name: newCatName }, { headers });
      setCategories([...categories, response.data]);
      setNewCatName('');
    } catch (err) {
      console.error("Error adding category:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER */}
        <header className="flex justify-between items-center mb-16">
          <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-5xl font-black tracking-tighter bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
              TaskSphere
            </h1>
            <p className="text-slate-500 text-sm mt-2">Productivity, refined.</p>
          </motion.div>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 border border-white/10 px-5 py-2.5 rounded-2xl transition-all group"
          >
            <LogOut className="size-4 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Sign Out</span>
          </button>
        </header>

        <main>
          {/* MAIN ACTION BAR */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="text-emerald-400" /> My Workspace
            </h2>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all active:scale-95 font-bold"
            >
              <Plus className="size-5" /> Add Task
            </button>
          </div>

          {/* SECONDARY ACTION BAR: CATEGORY MANAGEMENT */}
          <div className="flex justify-end mb-10">
            <form onSubmit={handleAddCategory} className="flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 w-full max-w-sm">
              <input 
                type="text" 
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Create new category..."
                className="flex-1 bg-transparent outline-none px-3 text-xs placeholder:text-slate-600"
              />
              <button 
                type="submit"
                className="bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
              >
                Add
              </button>
            </form>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-emerald-500 mb-4"></div>
              <p className="text-slate-500 font-medium">Loading your universe...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {tasks.map((task) => (
                  <motion.div
                    key={task.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-slate-900/50 backdrop-blur-xl border border-white/10 p-7 rounded-[2.5rem] hover:border-emerald-500/40 transition-all group relative shadow-2xl"
                  >
                    {task.priority === "High" && (
                      <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    )}

                    <div className="flex flex-wrap gap-2 mb-4">
                      {task.category && (
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 flex items-center gap-1 font-bold">
                          <Tag className="size-3" /> {task.category.name}
                        </span>
                      )}
                      <span className={`text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full ${
                        task.priority === 'High' ? 'bg-red-500/10 text-red-400' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {task.priority}
                      </span>
                    </div>

                    <div className="flex items-start gap-4 mb-4 cursor-pointer group/title" onClick={() => handleToggleComplete(task)}>
                      <div className="mt-1">
                        {task.completed ? (
                          <CheckCircle2 className="text-emerald-400 size-7 shrink-0" />
                        ) : (
                          <Circle className="text-slate-700 size-7 shrink-0 group-hover/title:text-emerald-500 transition-colors" />
                        )}
                      </div>
                      <h3 className={`text-xl font-bold transition-all leading-tight ${task.completed ? 'line-through text-slate-600' : 'text-white'}`}>
                        {task.title}
                      </h3>
                    </div>

                    <p className="text-slate-400 text-sm mb-8 line-clamp-3 min-h-[3rem]">
                      {task.description || "No description provided."}
                    </p>

                    <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                      <button onClick={() => openEditModal(task)} className="p-3 bg-slate-800 hover:bg-emerald-500/20 rounded-2xl text-emerald-400 transition-colors">
                        <Edit3 className="size-5" />
                      </button>
                      <button onClick={() => handleDelete(task.id)} className="p-3 bg-red-500/5 hover:bg-red-500 rounded-2xl text-red-400 hover:text-white transition-all">
                        <Trash2 className="size-5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {tasks.length === 0 && (
                <div className="col-span-full text-center py-32 bg-white/5 rounded-[3rem] border-2 border-dashed border-white/5">
                  <p className="text-slate-500 text-xl font-medium">Your workspace is empty. Ready to start?</p>
                </div>
              )}
            </div>
          )}
        </main>

        {/* MODAL PENTRU TASK-URI */}
        <AnimatePresence>
          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={closeAndResetModal}
                className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
                className="relative bg-slate-900 border border-white/10 w-full max-w-lg p-10 rounded-[3rem] shadow-2xl"
              >
                <h2 className="text-3xl font-black mb-8 text-emerald-400"> 
                  {editingTask ? "Refine Task" : "New Mission"} 
                </h2>
                
                <form onSubmit={handleSaveTask} className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Title</label>
                    <input 
                      type="text" required value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                      placeholder="e.g. Master React Layouts"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Notes</label>
                    <textarea 
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:ring-2 focus:ring-emerald-500 h-28 resize-none"
                      placeholder="Any specific details?"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Urgency</label>
                      <select 
                        value={newPriority}
                        onChange={(e) => setNewPriority(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Category</label>
                      <select 
                        value={selectedCategoryId}
                        onChange={(e) => setSelectedCategoryId(e.target.value)}
                        className="w-full bg-slate-950/50 border border-white/10 rounded-2xl p-4 mt-2 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="">None</option> 
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-4 pt-6">
                    <button type="button" onClick={closeAndResetModal} className="flex-1 py-4 text-slate-400 font-bold hover:text-white transition-colors">
                      Dismiss
                    </button>
                    <button type="submit" className="flex-[2] py-4 bg-emerald-600 rounded-2xl font-black text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition-all active:scale-95">
                      {editingTask ? "Save Changes" : "Deploy Task"}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default Dashboard;