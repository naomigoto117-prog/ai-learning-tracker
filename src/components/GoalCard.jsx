import { useEffect, useRef, useState } from "react";

export default function GoalCard({
  goal,
  onToggle,
  onEdit,
  onRequestDelete,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleEdit() {
    setIsMenuOpen(false);
    onEdit(goal);
  }

  function handleDelete() {
    setIsMenuOpen(false);
    onRequestDelete(goal);
  }

  return (
    <article
      className={`goal-card ${
        goal.completed ? "goal-completed" : ""
      }`}
    >
      <label className="goal-check">
        <input
          type="checkbox"
          checked={goal.completed}
          onChange={() => onToggle(goal.id)}
        />

        <span>
          <strong>{goal.title}</strong>
          <small>
            Deadline: {goal.deadline || "No deadline"}
          </small>
        </span>
      </label>

      <div className="goal-menu-container" ref={menuRef}>
        <button
          type="button"
          className="goal-menu-button"
          aria-label="Goal options"
          onClick={() =>
            setIsMenuOpen((open) => !open)
          }
        >
          ⋮
        </button>

        {isMenuOpen && (
          <div className="goal-dropdown-menu">
            <button
              type="button"
              onClick={handleEdit}
            >
              ✏️ Edit
            </button>

            <button
              type="button"
              className="goal-delete-option"
              onClick={handleDelete}
            >
              🗑 Delete
            </button>
          </div>
        )}
      </div>
    </article>
  );
}