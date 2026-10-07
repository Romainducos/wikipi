import { useState, useCallback } from "react";
import { api } from "../api";

export const useDocumentations = () => {
  const [documentations, setDocumentations] = useState([]);
  const [projectDocumentations, setProjectDocumentations] = useState([]);
  const [currentDocumentation, setCurrentDocumentation] = useState(null);

  const [loadingAll, setLoadingAll] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const [loadingCurrent, setLoadingCurrent] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false); // Pour create/update/delete

  const [error, setError] = useState(null);

  // Incrémenté à chaque création / modification / suppression, pour que les
  // listes locales (ex. docs d'un projet dans la sidebar) se rechargent
  const [docsVersion, setDocsVersion] = useState(0);

  const handleError = useCallback((err, defaultMessage) => {
    const errorMessage =
      err.response?.data?.message ||
      err.response?.data?.error ||
      defaultMessage;
    setError(errorMessage);
    console.error(defaultMessage, err);
    throw err;
  }, []);

  const loadDocumentations = useCallback(async () => {
    setLoadingAll(true);
    setError(null);

    try {
      const response = await api.get("/api/documentations");
      const docs = response.data.documentations || [];
      setDocumentations(docs);
      return docs;
    } catch (err) {
      return handleError(err, "Erreur lors du chargement des documentations");
    } finally {
      setLoadingAll(false);
    }
  }, [handleError]);

  const loadProjectDocumentations = useCallback(
    async (projectId) => {
      setLoadingProject(true);
      setError(null);

      try {
        const response = await api.get(
          `/api/documentations/projects/${projectId}/documentations`
        );
        const docs = response.data.documentations || [];
        setProjectDocumentations(docs);
        return docs;
      } catch (err) {
        return handleError(
          err,
          `Erreur lors du chargement des documentations du projet ${projectId}`
        );
      } finally {
        setLoadingProject(false);
      }
    },
    [handleError]
  );

  const loadDocumentation = useCallback(
    async (docId) => {
      setLoadingCurrent(true);
      setError(null);

      try {
        const response = await api.get(`/api/documentations/${docId}`);
        const doc = response.data.documentation;
        setCurrentDocumentation(doc);
        return doc;
      } catch (err) {
        return handleError(
          err,
          `Erreur lors du chargement de la documentation ${docId}`
        );
      } finally {
        setLoadingCurrent(false);
      }
    },
    [handleError]
  );

  const createDocumentation = useCallback(
    async (projectId, documentationData) => {
      setLoadingAction(true);
      setError(null);

      try {
        const response = await api.post(
          `/api/documentations/projects/${projectId}/documentations`,
          documentationData
        );

        const newDoc = response.data.documentation || response.data;

        if (!newDoc) {
          throw new Error("Documentation créée mais non retournée");
        }

        setDocsVersion((v) => v + 1);
        loadDocumentations().catch(() => {});
        return newDoc;
      } catch (err) {
        return handleError(
          err,
          "Erreur lors de la création de la documentation"
        );
      } finally {
        setLoadingAction(false);
      }
    },
    [handleError, loadDocumentations]
  );

  const updateDocumentation = useCallback(
    async (docId, docData) => {
      setLoadingAction(true);
      setError(null);

      try {
        await api.put(`/api/documentations/${docId}`, docData);
        setDocsVersion((v) => v + 1);
        loadDocumentations().catch(() => {});
        loadDocumentation(docId).catch(() => {});
      } catch (err) {
        return handleError(
          err,
          `Erreur lors de la modification de la documentation ${docId}`
        );
      } finally {
        setLoadingAction(false);
      }
    },
    [handleError, loadDocumentations, loadDocumentation]
  );

  const deleteDocumentation = useCallback(
    async (docId) => {
      setLoadingAction(true);
      setError(null);

      try {
        await api.delete(`/api/documentations/${docId}`);
        setDocsVersion((v) => v + 1);
        loadDocumentations().catch(() => {});
      } catch (err) {
        return handleError(
          err,
          `Erreur lors de la suppression de la documentation ${docId}`
        );
      } finally {
        setLoadingAction(false);
      }
    },
    [handleError, loadDocumentations]
  );

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    documentations,
    projectDocumentations,
    currentDocumentation,
    loadingAll,
    loadingProject,
    loadingCurrent,
    loadingAction,
    error,
    docsVersion,

    loadDocumentations,
    loadProjectDocumentations,
    loadDocumentation,
    createDocumentation,
    updateDocumentation,
    deleteDocumentation,
    resetError,
  };
};
