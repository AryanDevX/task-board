import { useEffect, useState } from "react";
import { taskApi } from "../api/tasks.api";
import { type Column as ColumnType} from "../types/models";
import { type Task } from "../types/models";
import { CreateTaskModal } from "../components/CreateTaskModal";
import { useParams } from "react-router-dom";

interface Props {
  column: ColumnType;
}

export default function Column({ column }:Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const {projectId ,boardId}=useParams<{projectId:string  ; boardId:string }>();
  const [showModal, setShowModal] = useState(false);

const handleTaskCreated = (task: Task) => {
  setTasks(prev => [...prev, task]);
};
  useEffect(() => {
    const fetchTasks = async () => {
      const data = await taskApi.getTasks( projectId!, boardId! ,String(column.id)!,);
      setTasks(data);
    };

    fetchTasks();
  }, [column.id]);

  return (
    <div
      style={{
        minWidth: "250px",
        background: "#f4f4f4",
        padding: "10px",
        borderRadius: "8px",
      }}
    >
      <h3>{column.title}</h3>
    <button onClick={() => setShowModal(true)}>+ Add Task</button>
      {tasks.map((task) => (
        <div
          key={task.id}
          style={{
            background: "white",
            padding: "8px",
            marginBottom: "8px",
            borderRadius: "4px",
          }}
        >
          {task.title}
        </div>
        
      ))}
      {showModal && (
  <CreateTaskModal
    columnId={String(column.id)}
    onClose={() => setShowModal(false)}
    onSuccess={handleTaskCreated}
  />
)}
    </div>
  );
}