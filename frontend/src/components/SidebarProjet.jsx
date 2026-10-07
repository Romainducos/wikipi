import { useState, useEffect, useCallback } from "react";
import { MdAdd } from "react-icons/md";
import { FaRegFolderClosed } from "react-icons/fa6";
import { NavLink, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { subscribe, DOCUMENTATIONS_CHANGED } from '../events.js';

const SidebarProjet = ({ project }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documentations, setDocumentations] = useState([]);
  const [error, setError] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  // Charger les documentations quand le project est ouvert
  const loadDocumentations = useCallback(async () => {
    setError(null);

    try {
      const response = await api.get(`/api/documentations/projects/${project.id}/documentations`);
      setDocumentations(response.data.documentations || []);
    } catch (err) {
      console.error('Erreur chargement documentations:', err);
      setError('Impossible de charger les documentations');
    }
  }, [project.id]);

  // Charger quand le project s'ouvre
  const handleToggle = async (e) => {
    setIsOpen(e.target.open);
    if (e.target.open && documentations.length === 0) {
      await loadDocumentations();
    }
  };

  // Recharger la liste si une documentation est créée pendant que le projet est ouvert
  useEffect(() => {
    if (!isOpen) return;
    return subscribe(DOCUMENTATIONS_CHANGED, loadDocumentations);
  }, [isOpen, loadDocumentations]);

  const handleNewDoc = () => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('nouvelleDoc', project.id);
    setSearchParams(newParams);
  };

  return (
    <li>
      <details onToggle={handleToggle}>
        <summary>
          <FaRegFolderClosed /> {project.title}
        </summary>
        <ul>
          <li>
            <label htmlFor="doc-modal" className="btn" onClick={handleNewDoc}>
              <MdAdd /> Nouvelle Documentation
            </label>
          </li>

          {error && <li className="text-sm text-red-500">{error}</li>}

          {documentations.map(doc => (
            <li key={doc.id}>
              <NavLink to={`/project/${project.id}/documentation/${doc.id}`}>
                {doc.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </details>
    </li>
  );
};

export default SidebarProjet;