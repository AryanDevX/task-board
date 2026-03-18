import { useState } from "react";
import { boardApi } from "../api/boards.api";
import { type Board } from "../types/models";

interface Props {
  projectId: string;
  onClose: () => void;
  onSuccess: (newBoard: Board) => void;
}

export const CreateBoardModal = ({ projectId, onClose, onSuccess }: Props) => {
  const [name, setName] = useState("");
  const [description,setDescription] = useState(" ");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);

    try {
      const data = await boardApi.createBoard(projectId, { title:name , description });
      onSuccess(data);   
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}>
        <h2>Create Board</h2>

        <form onSubmit={handleSubmit}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Board name"
          />
            <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description"
          />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Creating..." : "Create"}
          </button>
        </form>
      </div>
    </div>
  );
};