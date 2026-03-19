import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin.api'; 
import { type User } from '../types/models';
import styles from './ManageUsersModal.module.css';

interface ManageUsersModalProps {
  onClose: () => void;
}

export const ManageUsersModal = ({ onClose }: ManageUsersModalProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await adminApi.getAllUsers();
        setUsers(data.users);
      } catch (error) {
        console.error("Failed to load users:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string | number, newRole: 'GLOBAL_ADMIN' | 'USER') => {
    try {
      setUsers(users.map(u => u.id === userId ? { ...u, globalRole: newRole } : u));
      
      await adminApi.updateUserGlobalRole(userId, newRole);
    } 
    catch(error){
      console.error("Failed to update role:", error);
      alert("Failed to update user role. Please try again.");
    }
  };

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        
        <div className={styles.header}>
          <h2>Manage System Users</h2>
          <button className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>

        <input
          type="text"
          className={styles.searchInput}
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />

        {isLoading ? (
          <p className={styles.loadingText}>Loading users...</p>
        ) : (
          <ul className={styles.userList}>
            {filteredUsers.map((user) => (
              <li key={user.id} className={styles.userItem}>
                <div className={styles.userInfo}>
                  <span className={styles.userName}>{user.username}</span>
                  <span className={styles.userEmail}>{user.email}</span>
                </div>
                
                <select
                  className={styles.roleSelect}
                  value={user.globalRole}
                  onChange={(e) => handleRoleChange(user.id, e.target.value as 'GLOBAL_ADMIN' | 'USER')}
                >
                  <option value="USER">User</option>
                  <option value="GLOBAL_ADMIN">Global Admin</option>
                </select>
              </li>
            ))}
            
            {filteredUsers.length === 0 && (
              <p className={styles.loadingText}>No users found.</p>
            )}
          </ul>
        )}
      </div>
    </div>
  );
};