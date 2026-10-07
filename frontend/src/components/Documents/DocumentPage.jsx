import ReactMarkdown from "react-markdown";

const DocumentPage = ({ project, documentation }) => {
  return (
    <div>
      <main className="p-6 mt-30 mx-5 border-1 border-dashed border-base-300 rounded">

        <div className="flex justify-between items-center mb-6 pb-6 border-b">
          <div>
            <h1 className="text-3xl font-bold">{project?.title || "Projet inconnu"}</h1>
            <h2 className="text-2xl font-semibold">{documentation?.title || "Documentation inconnue"}</h2>
          </div>

          {documentation && (
            <button type="button" className="btn btn-link">
              Soumettre une modification
            </button>
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

        <div className="mt-8 pt-6 border-t flex gap-4 text-sm text-base-content/70">
          {documentation && (
            <>
              <span>Projet: {project?.title}</span>
              <span>
                Dernière modification:{" "}
                {new Date(documentation.updated_at).toLocaleDateString("fr-FR")}
              </span>
            </>
          )}
        </div>

      </main>
    </div>
  );
};

export default DocumentPage;
