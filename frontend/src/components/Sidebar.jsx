import { useState, useEffect } from 'react';
import { MdAdd } from 'react-icons/md';
import Loupe from "./Loupe.jsx";
import SidebarProjet from "./SidebarProjet.jsx";
import { api } from '../api.js';
import { emit, subscribe, OPEN_PROJECT_MODAL, PROJECTS_CHANGED } from '../events.js';

const Sidebar = ({ children }) => {
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/api/projects');
      const projectsData = response.data.projects || [];
      setProjects(projectsData);
      setFilteredProjects(projectsData);
    } catch (err) {
      console.error('Erreur chargement projets:', err);
      setError('Impossible de charger les projets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    return subscribe(PROJECTS_CHANGED, loadProjects);
  }, []);

  const handleFilter = (event) => {
    const searchTerm = event.target.value.toLowerCase();

    if (!searchTerm.trim()) {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter(project =>
        project.title.toLowerCase().includes(searchTerm)
      );
      setFilteredProjects(filtered);
    }
  };

  return (
    <div>
      <div className="drawer z-40 lg:drawer-open">
        <input id="my-drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {children}
        </div>
        <div className="drawer-side mt-20">
          <label
            htmlFor="my-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          ></label>
          <ul className="menu bg-base-200 min-h-full w-80 p-4">
            {/* La search bar */}
            <div className="join w-9/10">
              <label className="input join-item w-full">
                <Loupe strokeColor="currentColor" />
                <input
                  type="search"
                  placeholder="Search"
                  aria-label="Rechercher un projet"
                  onChange={handleFilter}
                />
              </label>
              <button type="button" aria-label="Rechercher" className="btn btn-primary btn-square join-item">
                <Loupe strokeColor="currentColor" />
              </button>
            </div>

            <ul className="menu bg-base-200 rounded-box w-9/10">
              <li>
                <button
                  type="button"
                  onClick={() => emit(OPEN_PROJECT_MODAL)}
                  className="btn flex justify-start w-full mb-4"
                >
                  <MdAdd /> Nouveau Projet
                </button>
              </li>

              {loading && (
                <li className="text-base-content/70 italic text-center py-4">
                  Chargement des projets...
                </li>
              )}

              {error && (
                <li className="text-error italic text-center py-4">
                  {error}
                </li>
              )}

              {!loading && !error && filteredProjects.length === 0 ? (
                <li className="text-base-content/70 italic text-center py-4">
                  Aucun project trouvé
                </li>
              ) : (
                filteredProjects.map(project => (
                  <SidebarProjet
                    key={project.id}
                    project={project}
                  />
                ))
              )}
            </ul>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;