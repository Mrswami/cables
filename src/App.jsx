import React, { useState, useMemo } from 'react';
import './index.css';
import agentsData from './agents.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Process categories
  const categories = useMemo(() => {
    const cats = new Set();
    agentsData.forEach(agent => {
      if (agent.category) {
        agent.category.split(',').forEach(c => cats.add(c.trim()));
      }
    });
    return ['All', ...Array.from(cats).filter(c => c).sort()];
  }, []);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agentsData.filter(agent => {
      const matchesSearch = (agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             agent.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || 
                              (agent.category && agent.category.includes(selectedCategory));
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="app-container">
      {/* Animated Background Elements */}
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>
      <div className="bg-shape shape-3"></div>

      <header className="header">
        <div className="header-content">
          <h1>
            <span className="gradient-text">Awesome</span> AI Agents
          </h1>
          <p className="subtitle">Discover the best artificial intelligence agents and assistants.</p>
          
          <div className="search-bar">
            <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text" 
              placeholder="Search agents by name or description..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="main-content">
        <aside className="sidebar">
          <h3>Categories</h3>
          <ul className="category-list">
            {categories.map(cat => (
              <li key={cat}>
                <button 
                  className={`category-btn ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="agents-grid">
          {filteredAgents.length > 0 ? (
            filteredAgents.map((agent, idx) => (
              <a 
                href={agent.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="agent-card" 
                key={idx}
                style={{ '--animation-order': idx }}
              >
                <div className="card-content">
                  <h2>{agent.name}</h2>
                  <p className="desc">{agent.description}</p>
                </div>
                <div className="card-footer">
                  <div className="tags">
                    {agent.category && agent.category.split(',').slice(0, 2).map((c, i) => (
                      <span key={i} className="tag">{c.trim()}</span>
                    ))}
                  </div>
                  <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                </div>
              </a>
            ))
          ) : (
            <div className="no-results">
              <h2>No agents found.</h2>
              <p>Try adjusting your search or category filters.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
