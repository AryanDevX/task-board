import { type ChangeEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth.api';
import { usersApi } from '../api/users.api';
import { NotificationCenter } from '../components/Notification';
import { useAuth } from '../context/AuthContext';
import { getAvatarSrc, getInitials } from '../utils/avatar';
import styles from './Profile.module.css';

export const Profile = () => {
  const { user, logout, dispatch } = useAuth();
  const navigate = useNavigate();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = getInitials(user?.username);
  const avatarSrc = getAvatarSrc(user?.avatar);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      await usersApi.uploadAvatar(file);
      const refreshedUser = await authApi.myProfile();
      dispatch({ type: 'LOGIN', payload: refreshedUser });
    } catch (error) {
      setUploadError(
        error instanceof Error ? error.message : 'Unable to upload avatar.',
      );
    } finally {
      setIsUploading(false);
      event.target.value = '';
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button
          className={styles.backButton}
          onClick={() => navigate('/dashboard')}
        >
          ← Dashboard
        </button>
        <NotificationCenter />
      </div>

      <section className={styles.card}>
        <div className={styles.avatarShell}>
          {avatarSrc ? (
            <img
              className={styles.avatarImage}
              src={avatarSrc}
              alt={`${user?.username || 'User'} avatar`}
            />
          ) : (
            <div className={styles.avatar}>{initials}</div>
          )}
        </div>
        <p className={styles.eyebrow}>My Profile</p>
        <h1>{user?.username || 'User'}</h1>
        <p className={styles.email}>{user?.email || 'No email available'}</p>
        <p className={styles.role}>{user?.globalRole || 'USER'}</p>
        <label className={styles.uploadButton}>
          <input
            className={styles.fileInput}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={isUploading}
          />
          {isUploading ? 'Uploading...' : 'Upload Avatar'}
        </label>
        {uploadError && <p className={styles.error}>{uploadError}</p>}
        <button className={styles.logoutButton} onClick={handleLogout}>
          Log out
        </button>
      </section>
    </div>
  );
};
