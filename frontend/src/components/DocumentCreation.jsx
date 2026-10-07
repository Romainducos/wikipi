import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { useForm } from "react-hook-form";
import { emit, subscribe, DOCUMENTATIONS_CHANGED, PROJECTS_CHANGED } from '../events.js';
import { focusAfterOpen } from '../focusAfterOpen.js';

const DocumentCreation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, reset, setFocus, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { projectId: "", title: "", excerpt: "", content: "" },
  });

  const dialogRef = useRef(null);
  const selectedProjectId = watch("projectId");
  const content = watch("content") || "";
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProjects = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/projects');
        setProjects(response.data.projects || []);
      } catch (err) {
        console.error('Erreur chargement projets:', err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
    return subscribe(PROJECTS_CHANGED, loadProjects);
  }, []);

  useEffect(() => {
    const projetId = searchParams.get('nouvelleDoc');
    const dialog = dialogRef.current;
    if (projetId && dialog) {
      if (!dialog.open) {
        dialog.showModal();
        focusAfterOpen(() => setFocus("title"));
      }
      const projetExiste = projects.find(p => p.id.toString() === projetId);
      if (projetExiste) {
        setValue("projectId", projetId);
      }
    }
  }, [searchParams, projects, setValue, setFocus]);

  const handleCloseModal = () => {
    navigate({ search: '' });
    reset();
  };

  const onSubmit = async (data) => {
    try {
      const documentData = {
        title: data.title.trim(),
        excerpt: data.excerpt.trim() || null,
        content: data.content.trim(),
      };

      const response = await api.post(
        `/api/documentations/projects/${data.projectId}/documentations`,
        documentData
      );

      if (response.status === 201) {
        dialogRef.current?.close();
        emit(DOCUMENTATIONS_CHANGED);
      }

    } catch (error) {
      console.error("Erreur création documentation:", error);
      if (error.response?.data?.message) {
        alert(`Erreur: ${error.response.data.message}`);
      } else if (error.response?.data?.error) {
        alert(`Erreur: ${error.response.data.error}`);
      } else {
        alert("Erreur lors de la création de la documentation");
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      id="doc-modal"
      className="modal backdrop-blur-lg"
      onClose={handleCloseModal}
    >
      <div className="modal-box flex flex-col items-center p-10 w-[420px]">
        <h2 className="text-2xl font-bold text-center mb-6">
          Créer une documentation
        </h2>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 w-full">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Projet parent <span className="text-error">*</span>
            </legend>
            <select
              {...register("projectId", {
                required: "Sélectionnez un projet",
                validate: value => value !== "" || "Sélectionnez un projet"
              })}
              className={`select w-full ${errors.projectId ? "select-error" : ""}`}
              disabled={loading}
            >
              <option value="">Choisir un projet...</option>
              {loading ? (
                <option disabled>Chargement des projets...</option>
              ) : (
                projects.map((projet) => (
                  <option key={projet.id} value={projet.id}>
                    {projet.title}
                  </option>
                ))
              )}
            </select>
            {errors.projectId ? (
              <p className="label text-error">{errors.projectId.message}</p>
            ) : (
              <p className="label">Sélectionnez le projet auquel lier cette documentation</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Titre de la documentation <span className="text-error">*</span>
            </legend>
            <input
              {...register("title", {
                required: "Titre obligatoire",
              })}
              type="text"
              placeholder="Titre de la documentation"
              className={`input w-full ${errors.title ? "input-error" : ""}`}
            />
            {errors.title && (
              <p className="label text-error">{errors.title.message}</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Extrait</legend>
            <textarea
              {...register("excerpt", {
                maxLength: {
                  value: 50,
                  message: "Maximum 50 caractères"
                }
              })}
              placeholder="Courte description"
              className={`textarea w-full resize-none ${errors.excerpt ? "textarea-error" : ""}`}
              rows="2"
            />
            {errors.excerpt ? (
              <p className="label text-error">{errors.excerpt.message}</p>
            ) : (
              <p className="label">Résumé court (optionnel, max 50 caractères)</p>
            )}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">
              Contenu <span className="text-error">*</span>
            </legend>
            <textarea
              {...register("content", {
                required: "Contenu obligatoire",
                maxLength: {
                  value: 10000,
                  message: "Maximum 10000 caractères"
                }
              })}
              placeholder="Contenu de la documentation"
              className={`textarea w-full min-h-32 ${errors.content ? "textarea-error" : ""}`}
            />
            {errors.content && (
              <p className="label text-error">{errors.content.message}</p>
            )}
            <div className="label justify-between">
              <span>Contenu principal en Markdown</span>
              <span>{content.length}/10000 caractères</span>
            </div>
          </fieldset>

          <button
            type="submit"
            disabled={isSubmitting || !selectedProjectId}
            className="btn btn-primary w-full mt-4"
          >
            {isSubmitting ? "Création..." : "Créer la documentation"}
          </button>
        </form>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>Fermer</button>
      </form>
    </dialog>
  );
};

export default DocumentCreation;
