import { apiFetch } from './client';

export const usersApi = {
  uploadAvatar: (file: File): Promise<{ message: string; avatar: string }> => {
    const formData = new FormData();
    formData.append('avatar', file);

    return apiFetch('/users/avatars', {
      method: 'PATCH',
      body: formData,
    });
  },
};
