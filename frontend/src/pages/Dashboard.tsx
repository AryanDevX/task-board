import { useAuth } from '../context/AuthContext.tsx';

export const Dashboard = () => {
  const { user, dispatch } = useAuth();
  return (
    <div>
      <h1>Project Dashboard</h1>
      <p>Welcome, {user?.name || 'Guest'}!</p>
      <button onClick={() => dispatch({ type: 'LOGOUT' })}>Log Out</button>
    </div>
  );
};
