import { useState, useCallback } from "react";
import { api } from "../api";

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentProject, setCurrentProject] = useState(null);

  const handleError = useCallback((err, defaultMessage) => {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      defaultMessage;
    setError(errorMessage);
    console.error(defaultMessage, err);
    throw err;
  }, []);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get("/api/projects");
      const projectsData = response.data.projects || [];
      setProjects(projectsData);
      return projectsData;
    } catch (err) {
      return handleError(err, "Erreur lors du chargement des projets");
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  // Chargement propre à une page : ne touche pas au loading / error de la
  // liste partagée (sinon la sidebar affiche le chargement ou l'erreur)
  const loadProject = useCallback(async (projectId) => {
    const response = await api.get(`/api/projects/${projectId}`);
    const projectData = response.data.project;
    setCurrentProject(projectData);
    return projectData;
  }, []);

  const createProject = useCallback(
    async (projectData) => {
      try {
        const response = await api.post("/api/projects", projectData);
        // Recharge la liste partagée (sidebar, select des modales)
        loadProjects().catch(() => {});
        return response.data.project;
      } catch (err) {
        // L'erreur est affichée par la modale, pas dans les listes
        console.error("Erreur lors de la création du projet", err);
        throw err;
      }
    },
    [loadProjects]
  );

  const updateProject = useCallback(
    async (projectId, projectData) => {
      try {
        const response = await api.put(`/api/projects/${projectId}`, projectData);
        loadProjects().catch(() => {});
        return response.data.project;
      } catch (err) {
        console.error("Erreur lors de la mise à jour du projet", err);
        throw err;
      }
    },
    [loadProjects]
  );

  const deleteProject = useCallback(
    async (projectId) => {
      try {
        await api.delete(`/api/projects/${projectId}`);
        loadProjects().catch(() => {});
      } catch (err) {
        console.error("Erreur lors de la suppression du projet", err);
        throw err;
      }
    },
    [loadProjects]
  );

  const getProjectById = useCallback(
    (projectId) => {
      return projects.find((project) => project.id === projectId);
    },
    [projects]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    projects,
    currentProject,
    loading,
    error,

    loadProjects,
    loadProject,
    createProject,
    updateProject,
    deleteProject,
    getProjectById,
    resetError,
    setCurrentProject,
  };
};
