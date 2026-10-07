import { useState, useEffect, useRef } from "react"
import { useSearchParams } from 'react-router-dom'
import { useForm } from "react-hook-form"
import { useDocumentationsContext } from "../../hooks/useDocumentationsContext"
import { useProjectsContext } from "../../hooks/useProjectsContext"
import { focusAfterOpen } from '../../focusAfterOpen'

const DocumentCreationModal = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { register, handleSubmit, watch, setValue, reset, setFocus, formState: { errors, isSubmitting } } = useForm({
    defaultValues: { projectId: "", title: "", excerpt: "", content: "" },
  })
  const dialogRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)
  const selectedProjectId = watch("projectId")
  const content = watch("content") || ""

  const { createDocumentation } = useDocumentationsContext()
  const { projects, loading: projectsLoading } = useProjectsContext()

  // Ouverture via ?nouvelleDoc=<id du projet>
  useEffect(() => {
    const projetId = searchParams.get('nouvelleDoc')
    const dialog = dialogRef.current
    if (projetId && dialog) {
      if (!dialog.open) {
        dialog.showModal()
        focusAfterOpen(dialog, () => setFocus("title"))
      }
      if (projects.some(p => p.id.toString() === projetId)) {
        setValue("projectId", projetId)
      }
    }
  }, [searchParams, projects, setValue, setFocus])

  const handleClose = () => {
    setSearchParams((params) => {
      params.delete('nouvelleDoc')
      return params
    })
    reset()
    setSubmitError(null)
  }

  const onSubmit = async (data) => {
    setSubmitError(null)
    try {
      await createDocumentation(data.projectId, {
        title: data.title.trim(),
        excerpt: data.excerpt.trim() || null,
        content: data.content.trim()
      })
      dialogRef.current?.close()
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "Erreur lors de la création de la documentation"
      )
    }
  }

  return (
    <dialog
      ref={dialogRef}
      id="doc-modal"
      className="modal backdrop-blur-lg"
      onClose={handleClose}
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
              {...register("projectId", { required: "Sélectionnez un projet" })}
              className={`select w-full ${errors.projectId ? "select-error" : ""}`}
              disabled={projectsLoading}
            >
              <option value="">Choisir un projet...</option>
              {projectsLoading ? (
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

          {submitError && (
            <div role="alert" className="alert alert-error alert-soft">{submitError}</div>
          )}

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
  )
}

export default DocumentCreationModal
