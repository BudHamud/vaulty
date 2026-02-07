import React, { useState, useEffect } from 'react';

const Explorar = () => {
  const [ideas, setIdeas] = useState(() => {
    const saved = localStorage.getItem('ideas-anime');
    return saved ? JSON.parse(saved) : [
      { id: 1, title: 'Pluto', reason: 'Del creador de Monster, thriller reflexivo.' },
      { id: 2, title: 'March Comes in Like a Lion', reason: 'Slice of life profundo sobre superación.' }
    ];
  });

  const [newIdea, setNewIdea] = useState({ title: '', reason: '' });

  useEffect(() => {
    localStorage.setItem('ideas-anime', JSON.stringify(ideas));
  }, [ideas]);

  const addIdea = (e) => {
    e.preventDefault();
    if (!newIdea.title) return;
    setIdeas([...ideas, { ...newIdea, id: Date.now() }]);
    setNewIdea({ title: '', reason: '' });
  };

  const removeIdea = (id) => setIdeas(ideas.filter(i => i.id !== id));

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">🔍 Explorar</h2>
        <p className="text-slate-500 mb-8">Ideas y recomendaciones para el futuro.</p>

        <form onSubmit={addIdea} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-4">
          <input 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="Nombre del anime..." 
            value={newIdea.title}
            onChange={e => setNewIdea({...newIdea, title: e.target.value})}
          />
          <input 
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
            placeholder="¿Por qué verlo?" 
            value={newIdea.reason}
            onChange={e => setNewIdea({...newIdea, reason: e.target.value})}
          />
          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg transition-all shadow-md">
            Guardar Sugerencia
          </button>
        </form>

        <div className="grid gap-4">
          {ideas.map(idea => (
            <div key={idea.id} className="group bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center hover:border-emerald-300 transition-colors">
              <div>
                <h4 className="font-bold text-slate-800">{idea.title}</h4>
                <p className="text-sm text-slate-600">{idea.reason}</p>
              </div>
              <button 
                onClick={() => removeIdea(idea.id)}
                className="text-slate-300 hover:text-red-500 transition-colors p-2"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explorar;