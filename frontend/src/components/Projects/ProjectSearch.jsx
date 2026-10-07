import SearchIcon from "../Shared/SearchIcon"

const ProjectSearch = ({ onSearch }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
  }

  return (
    <form onSubmit={handleSubmit} className="join w-9/10 mb-4">
      <label className="input join-item w-full">
        <SearchIcon strokeColor="currentColor" />
        <input
          type="search"
          placeholder="Search"
          aria-label="Rechercher un projet"
          onChange={(e) => onSearch(e.target.value)}
        />
      </label>
      <button
        type="submit"
        aria-label="Rechercher"
        className="btn btn-primary btn-square join-item"
      >
        <SearchIcon strokeColor="currentColor" />
      </button>
    </form>
  )
}

export default ProjectSearch
