function Filters({ subjects, filterSubject, setFilterSubject, filterCategory, setFilterCategory, onApply }) {
  const handleApply = (e) => {
    e.preventDefault();
    onApply();
  };

  return (
    <div className="border-b border-gray-100 pb-8 mb-8">
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Filters</h2>
      <form onSubmit={handleApply} className="flex gap-4">
        <select
          value={filterSubject}
          onChange={e => setFilterSubject(e.target.value)}
          className="flex-1 text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2"
        >
          <option value="">All Subjects</option>
          {subjects.map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="flex-1 text-sm text-gray-500 focus:outline-none bg-transparent border-b border-gray-200 py-2"
        >
          <option value="">All Categories</option>
          <option value="CLASS_NOTES">Class Notes</option>
          <option value="ASSIGNMENT">Assignment</option>
          <option value="EXPERIMENT">Experiment</option>
        </select>
        <button
          type="submit"
          className="bg-gray-900 hover:bg-gray-700 text-white text-xs font-medium px-4 py-2 transition-colors"
        >
          Apply
        </button>
      </form>
    </div>
  );
}

export default Filters;