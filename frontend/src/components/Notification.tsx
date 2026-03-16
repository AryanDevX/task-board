import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { type Notification } from '../types/models'; 
import styles from './NotificationCenter.module.css';

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const handleNotificationClick = (notification: Notification) => {
    if (notification.taskId) {
      navigate(`/project/${notification.taskId}`); 
    }
    setIsOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className={styles.container}>
      <button className={styles.bellBtn} onClick={() => setIsOpen(!isOpen)}>
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.header}>
            <h3>Notifications</h3>
          </div>
          <div className={styles.list}>
            {notifications.length === 0 ? (
              <p className={styles.emptyText}>All caught up!</p>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`${styles.item} ${!n.isRead ? styles.unread : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <p>{n.message}</p>
                  <div className={styles.time}>
                    {new Date(n.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};