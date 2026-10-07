import { lineDiff } from "../../utils/lineDiff"

const LINE_STYLES = {
  add: "bg-success/15",
  del: "bg-error/15 line-through decoration-error/60",
  same: "text-base-content/60",
}
const LINE_PREFIX = { add: "+", del: "−", same: " " }

// Avant / après d'un champ texte, ligne par ligne
const FieldDiff = ({ label, before, after }) => {
  if ((before || "") === (after || "")) return null
  return (
    <div className="flex flex-col gap-1">
      <h4 className="font-semibold text-sm">{label}</h4>
      <pre className="text-sm rounded-box border border-base-300 overflow-x-auto py-2 whitespace-pre-wrap">
        {lineDiff(before, after).map((line, index) => (
          <div key={index} className={`px-3 ${LINE_STYLES[line.type]}`}>
            <span aria-hidden="true" className="select-none mr-2">{LINE_PREFIX[line.type]}</span>
            <span className="sr-only">{line.type === "add" ? "ajouté : " : line.type === "del" ? "supprimé : " : ""}</span>
            {line.text || " "}
          </div>
        ))}
      </pre>
    </div>
  )
}

// Changements d'une proposition par rapport à la version actuelle de la doc
const ProposalChanges = ({ proposal }) => (
  <div className="flex flex-col gap-3">
    <FieldDiff label="Titre" before={proposal.current_title} after={proposal.title} />
    <FieldDiff label="Extrait" before={proposal.current_excerpt} after={proposal.excerpt} />
    <FieldDiff label="Contenu" before={proposal.current_content} after={proposal.content} />
  </div>
)

export default ProposalChanges
