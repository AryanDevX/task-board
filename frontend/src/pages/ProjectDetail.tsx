import { useParams } from 'react-router-dom';

export const ProjectDetail = () => {
  const { id } = useParams();
  return <h1>Viewing Details for Project ID: {id}</h1>;
};
