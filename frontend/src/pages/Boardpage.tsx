import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { columnApi } from "../api/column.api";
import { type Column } from "../types/models";
import ColumnComponent from "./Column";

export const BoardPage = () => {
  const { boardId, projectId } = useParams<{ boardId: string ;projectId: string }>();

  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!boardId) return;

    const fetchColumns = async () => {
      try {
        setLoading(true);
        const data = await columnApi.getColumns(boardId,projectId!);
        setColumns(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchColumns();
  }, [boardId]);

  if (loading) return <p>Loading columns...</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Board</h2>

      <div style={{ display: "flex", gap: "16px" }}>
        {columns.map((col) => (
          <ColumnComponent key={col.id} column={col} />
        ))}
      </div>
    </div>
  );
};