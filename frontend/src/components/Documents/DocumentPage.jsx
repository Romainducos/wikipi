import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { useDocumentationsContext } from "../../hooks/useDocumentationsContext";
import ConfirmDialog from "../Shared/ConfirmDialog";

const DocumentPage = ({ project, documentation }) => {
  const navigate = useNavigate();
  const { deleteDocumentation } = useDocumentationsContext();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const permissions = documentation?.permissions || {};

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocumentation(documentation.id);
      navigate(`/project/${project.id}`);
    } catch (error) {
      setDeleteError(error.response?.data?.message || "Erreur lors de la suppression");
      setDeleting(false);
    }
  };

  return (
    <div>
      <main className="p-6 mt-30 mx-5 border-1 border-dashed border-base-300 rounded">

        <div className="breadcrumbs text-sm mb-2">
          <ul>
            <li><NavLink to={`/project/${project.id}`}>{project.title}</NavLink></li>
            <li>{documentation?.title}</li>
          </ul>
        </div>

        <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-base-300">
          <div>
            <h1 className="text-3xl font-bold">{documentation?.title || "Documentation inconnue"}</h1>
            {documentation?.author_name && (
              <p className="text-sm text-base-content/70 mt-1">Par {documentation.author_name}</p>
            )}
          </div>

          {documentation && (
            <div className="flex gap-2">
              <button type="button" className="btn btn-link">
                Soumettre une modification
              </button>
              {permissions.canDelete && (
                <button type="button" className="btn btn-sm btn-error btn-outline" onClick={() => setDeleteOpen(true)}>
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
        <div className="flex justify-center mt-10">
          {/* Rendu Markdown propre */}
          <div className="prose max-w-8/10">
            {documentation?.content ? (
              <ReactMarkdown>{documentation.content}</ReactMarkdown>
            ) : (
              <p>Pas de description pour le moment</p>
            )}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-base-300 flex gap-4 text-sm text-base-content/70">
          {documentation && (
            <>
              <span>Projet : {project.title}</span>
              <span>
                Dernière modification :{" "}
                {new Date(documentation.updated_at).toLocaleDateString("fr-FR")}
              </span>
            </>
          )}
        </div>

      </main>

      {permissions.canDelete && (
        <ConfirmDialog
          open={deleteOpen}
          title="Supprimer la documentation ?"
          message={`« ${documentation.title} » sera définitivement supprimée.`}
          confirmLabel="Supprimer"
          busy={deleting}
          error={deleteError}
          onConfirm={handleDelete}
          onCancel={() => { setDeleteOpen(false); setDeleteError(null); }}
        />
      )}
    </div>
  );
};

export default DocumentPage;
