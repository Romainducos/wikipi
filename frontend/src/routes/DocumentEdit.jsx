import { useEffect, useState } from "react"
import { NavLink, useNavigate, useParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import ReactMarkdown from "react-markdown"
import AppLayout from "../components/Layout/AppLayout"
import { useAuthProtection } from "../hooks/useAuthProtection"
import { useDocumentationsContext } from "../hooks/useDocumentationsContext"
import { api } from "../api"

// Modifier une documentation (auteur, modo, admin) ou proposer une
// modification (les autres) : même formulaire, envoi différent
const DocumentEdit = () => {
  useAuthProtection()
  const { projectId, docId } = useParams()
  const navigate = useNavigate()
  const { loadDocumentation, updateDocumentation } = useDocumentationsContext()

  const [documentation, setDocumentation] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [tab, setTab] = useState("write")
  const { register, handleSubmit, reset, watch, formState: { errors, isSubmitting } } = useForm()
  const content = watch("content") || ""

  useEffect(() => {
    loadDocumentation(docId)
      .then((doc) => {
        setDocumentation(doc)
        reset({ title: doc.title, excerpt: doc.excerpt || "", content: doc.content || "", message: "" })
      })
      .catch((err) => setLoadError(
        err.response?.status === 404
          ? "Documentation introuvable, ou vous n'y avez pas accès."
          : "Erreur lors du chargement de la documentation"
      ))
  }, [docId, loadDocumentation, reset])

  const canEdit = documentation?.permissions?.canEdit
  const docUrl = `/project/${projectId}/documentation/${docId}`

  const onSubmit = async (data) => {
    setSubmitError(null)
    const payload = {
      title: data.title.trim(),
      excerpt: data.excerpt.trim() || null,
      content: data.content,
    }
    try {
      if (canEdit) {
        await updateDocumentation(docId, payload)
        navigate(docUrl, { state: { flash: "Documentation mise à jour" } })
      } else {
        await api.post(`/api/documentations/${docId}/proposals`, { ...payload, message: data.message })
        navigate(docUrl, { state: { flash: "Proposition envoyée : l'auteur ou un modérateur va la relire" } })
      }
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Erreur lors de l'enregistrement")
    }
  }

  if (loadError) {
    return (
      <AppLayout>
        <main className="p-6 mt-30 mx-5">
          <div role="alert" className="alert alert-error alert-soft">{loadError}</div>
        </main>
      </AppLayout>
    )
  }

  if (!documentation) {
    return (
      <AppLayout>
        <main className="p-6 mt-30 mx-5 flex justify-center">
          <span className="loading loading-spinner loading-lg"></span>
        </main>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <main className="p-6 mt-30 mx-5 border-1 border-dashed border-base-300 rounded">
        <div className="breadcrumbs text-sm mb-2">
          <ul>
            <li><NavLink to={`/project/${projectId}`}>{documentation.project_title}</NavLink></li>
            <li><NavLink to={docUrl}>{documentation.title}</NavLink></li>
            <li>{canEdit ? "Modifier" : "Proposer une modification"}</li>
          </ul>
        </div>

        <h1 className="text-3xl font-bold mb-2">
          {canEdit ? "Modifier la documentation" : "Proposer une modification"}
        </h1>
        {!canEdit && (
          <p className="text-base-content/70 mb-4">
            Votre proposition sera relue par l'auteur ou un modérateur avant d'être publiée.
          </p>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-2 max-w-4xl">
          <fieldset className="fieldset">
            <legend className="fieldset-legend">Titre <span className="text-error">*</span></legend>
            <input
              {...register("title", { required: "Titre obligatoire" })}
              type="text"
              className={`input w-full ${errors.title ? "input-error" : ""}`}
            />
            {errors.title && <p className="label text-error">{errors.title.message}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Extrait</legend>
            <input
              {...register("excerpt", { maxLength: { value: 50, message: "Maximum 50 caractères" } })}
              type="text"
              className={`input w-full ${errors.excerpt ? "input-error" : ""}`}
            />
            {errors.excerpt && <p className="label text-error">{errors.excerpt.message}</p>}
          </fieldset>

          <fieldset className="fieldset">
            <legend className="fieldset-legend">Contenu (Markdown) <span className="text-error">*</span></legend>
            <div role="tablist" className="tabs tabs-border">
              <button type="button" role="tab" className={`tab ${tab === "write" ? "tab-active" : ""}`} onClick={() => setTab("write")}>
                Écrire
              </button>
              <button type="button" role="tab" className={`tab ${tab === "preview" ? "tab-active" : ""}`} onClick={() => setTab("preview")}>
                Aperçu
              </button>
            </div>
            <textarea
              {...register("content", {
                required: "Contenu obligatoire",
                maxLength: { value: 10000, message: "Maximum 10000 caractères" },
              })}
              className={`textarea w-full min-h-80 font-mono ${errors.content ? "textarea-error" : ""} ${tab === "write" ? "" : "hidden"}`}
            />
            {tab === "preview" && (
              <div className="prose max-w-none border border-base-300 rounded-box p-4 min-h-80">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            )}
            {errors.content && <p className="label text-error">{errors.content.message}</p>}
            <p className="label justify-end">{content.length}/10000 caractères</p>
          </fieldset>

          {!canEdit && (
            <fieldset className="fieldset">
              <legend className="fieldset-legend">Pourquoi cette modification ?</legend>
              <textarea
                {...register("message", { maxLength: { value: 500, message: "Maximum 500 caractères" } })}
                placeholder="Ex. : correction d'une commande, ajout d'une étape manquante..."
                className="textarea w-full resize-none"
                rows="2"
              />
              {errors.message && <p className="label text-error">{errors.message.message}</p>}
            </fieldset>
          )}

          {submitError && <div role="alert" className="alert alert-error alert-soft">{submitError}</div>}

          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={isSubmitting} className="btn btn-primary">
              {isSubmitting ? "Envoi..." : canEdit ? "Enregistrer" : "Envoyer la proposition"}
            </button>
            <NavLink to={docUrl} className="btn btn-ghost">Annuler</NavLink>
          </div>
        </form>
      </main>
    </AppLayout>
  )
}

export default DocumentEdit
