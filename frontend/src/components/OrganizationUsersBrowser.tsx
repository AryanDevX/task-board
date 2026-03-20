import { useState, type ReactNode } from 'react';
import { useOrganizationUsers } from '../hooks/useOrganizationUsers';
import type { User } from '../types/models';
import styles from './OrganizationUsersBrowser.module.css';

interface Props {
  title?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
  filterUsers?: (user: User) => boolean;
  renderAction?: (user: User) => ReactNode;
}

export const OrganizationUsersBrowser = ({
  title,
  searchPlaceholder = 'Search users by name or email...',
  emptyMessage = 'No users found.',
  pageSize = 10,
  filterUsers,
  renderAction,
}: Props) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const { users, isLoading, error, total, totalPages } = useOrganizationUsers({
    page,
    limit: pageSize,
    search: searchQuery,
  });

  const visibleUsers = filterUsers ? users.filter(filterUsers) : users;

  return (
    <div className={styles.browser}>
      {title ? <p className={styles.metaText}>{title}</p> : null}

      <div className={styles.toolbar}>
        <input
          type="text"
          className={styles.searchInput}
          placeholder={searchPlaceholder}
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
        />
      </div>

      <p className={styles.metaText}>
        {isLoading ? 'Loading users...' : `${total} users found`}
      </p>

      {error ? (
        <p className={styles.emptyState}>{error}</p>
      ) : isLoading ? (
        <p className={styles.emptyState}>Loading users...</p>
      ) : visibleUsers.length === 0 ? (
        <p className={styles.emptyState}>{emptyMessage}</p>
      ) : (
        <ul className={styles.userList}>
          {visibleUsers.map((user) => (
            <li key={user.id} className={styles.userItem}>
              <div className={styles.userInfo}>
                <span className={styles.userName}>{user.username}</span>
                <span className={styles.userEmail}>{user.email}</span>
              </div>
              {renderAction ? renderAction(user) : null}
            </li>
          ))}
        </ul>
      )}

      <div className={styles.pagination}>
        <p className={styles.metaText}>
          Page {page} of {totalPages}
        </p>
        <div className={styles.pageButtons}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || isLoading}
          >
            Previous
          </button>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
            disabled={page === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};
