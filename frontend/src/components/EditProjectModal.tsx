import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { type Project, type ProjectRole } from '../types/models';
import { projectApi } from '../api/project.api';
import styles from './EditProjectModal.module.css';

interface EditProjectModalProps {
  project: Project;
  onClose: () => void;
  onSuccess: (updatedProject: Project) => void;
}

interface ProjectMemberPayload {
  email: string;
  role: ProjectRole;
}

export const EditProjectModal = ({project, onClose, onSuccess}: EditProjectModalProps) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isLoading, setIsLoading] = useState(false);
  const [isMembersLoading, setIsMembersLoading] = useState(true);

  const [initialMembers, setInitialMembers] = useState<ProjectMemberPayload[]>([]);
  const [activeMembers, setActiveMembers] = useState<ProjectMemberPayload[]>([]);
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('PROJECT_MEMBER');

  const { user } = useAuth();
  const isGlobalAdmin = user?.globalRole === 'GLOBAL_ADMIN';

  useEffect(() => {
    const fetchMembers = async () => {
      setIsMembersLoading(true);
      try{
        const data = await projectApi.getMembers(String(project.id));
        const members = data.members.map((member) => ({
          email: member.email,
          role: member.role,
        }));
        setInitialMembers(members);
        setActiveMembers(members);
      }
      catch (error){
        console.error('Failed to load project members', error);
        alert('Failed to load project members. Please try again.');
      }
      finally{
        setIsMembersLoading(false);
      }
    };
    void fetchMembers();
  }, [project.id]);

  const handleAddMember = () => {
    const normalizedEmail = newMemberEmail.trim().toLowerCase();
    if(!normalizedEmail) return;

    if(activeMembers.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      alert('This user is already in the list!');
      return;
    }

    setActiveMembers([...activeMembers, { email: normalizedEmail, role: newMemberRole }]);
    setNewMemberEmail('');
    setNewMemberRole('PROJECT_MEMBER');
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setActiveMembers(activeMembers.filter((member) => member.email !== emailToRemove));
  };

  const handleRoleChange = (email: string, newRole: ProjectRole) => {
    setActiveMembers(activeMembers.map(m => 
      m.email === email ? { ...m, role: newRole } : m
    ));
  };

  const handleSubmit = async(e:React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      const data = await projectApi.updateProject(String(project.id), {
        projectname: name,
        description
      });

      const addedMembers = activeMembers.filter(am => !initialMembers.some(im => im.email === am.email));
      const removedMembers = initialMembers.filter(im => !activeMembers.some(am => am.email === im.email));
      const updatedMembers = activeMembers.filter(am => {
        const initial = initialMembers.find(im => im.email === am.email);
        return initial && initial.role !== am.role;
      });

      for(const member of addedMembers){
        await projectApi.addMember(String(project.id), member.email, member.role);
      }
      for(const member of removedMembers){
        await projectApi.removeMember(String(project.id), member.email);
      }
      for(const member of updatedMembers){
        await projectApi.updateMemberRole(String(project.id), member.email, member.role);
      }

      onSuccess(data);
      onClose();
    }
    catch(error){
      console.error('Failed to update project', error);
      alert('Failed to update project. Please try again.');
    }
    finally{
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Edit Project & Team</h2>
        <form onSubmit={handleSubmit}>
          
          <div className={styles.inputGroup}>
            <label>Project Name</label>
            <input
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Description</label>
            <textarea
              className={styles.input}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <hr className={styles.separator} />
          <h3>Users in Project</h3>
          
          <div className={styles.memberInputRow}>
            <input
              type="email"
              className={styles.input}
              placeholder="User's email address"
              value={newMemberEmail}
              onChange={(e) => setNewMemberEmail(e.target.value)}
            />
            <select 
              className={styles.input}
              value={newMemberRole} 
              onChange={(e) => setNewMemberRole(e.target.value as ProjectRole)}
            >
              <option value="PROJECT_MEMBER">Member</option>
              <option value="PROJECT_ADMIN">Admin</option>
              <option value="PROJECT_VIEWER">Viewer</option>
            </select>
            <button 
              type="button" 
              className={styles.addBtn}
              onClick={handleAddMember}
            >Add
            </button>
          </div>

          {isMembersLoading ? (
            <p className={styles.loadingText}>Loading team members...</p>
          ) : activeMembers.length > 0 && (
            <ul className={styles.memberList}>
              {activeMembers.map((member) => (
                <li key={member.email} className={styles.memberItem}>
                  
                  <strong>{member.email}</strong>
                  
                  <div className={styles.memberActions}>
                    <select
                      className={`${styles.input} ${styles.roleSelect}${styles[member.role]}`}
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.email, e.target.value as ProjectRole)}
                    >
                      <option value="PROJECT_MEMBER">Member</option>
                      {(isGlobalAdmin || member.role === 'PROJECT_ADMIN') && (
                        <option value="PROJECT_ADMIN" disabled={!isGlobalAdmin}>
                          Admin
                        </option>
                      )}
                      
                      <option value="PROJECT_VIEWER">Viewer</option>
                    </select>
                    
                    <button 
                      type="button" 
                      className={styles.removeBtn}
                      onClick={() => handleRemoveMember(member.email)}
                    >
                      Remove
                    </button>
                  </div>
                  
                </li>
              ))}
            </ul>
          )}

          <div className={styles.modalActions}>
            <button 
              type="button" 
              className={styles.cancelBtn} 
              onClick={onClose} 
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className={`${styles.button} ${styles.submitBtn}`} 
              disabled={isLoading}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};