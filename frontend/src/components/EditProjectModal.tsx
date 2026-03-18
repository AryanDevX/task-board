import { useState } from 'react';
import { type Project } from '../types/models';
import { projectApi } from '../api/project.api';
import styles from './EditProjectModal.module.css';

type ProjectRole = 'PROJECT_ADMIN' | 'PROJECT_MEMBER' | 'PROJECT_VIEWER';

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

  const [members, setMembers] = useState<ProjectMemberPayload[]>([]); 
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<ProjectRole>('PROJECT_MEMBER');

  const handleAddMember = () => {
    if(!newMemberEmail.trim()) return;
    if(members.some(m => m.email === newMemberEmail)) {
      alert('This user is already in the list!');
      return;
    }
    setMembers([...members, { email: newMemberEmail, role: newMemberRole }]);
    setNewMemberEmail('');
  };

  const handleRemoveMember = (emailToRemove: string) => {
    setMembers(members.filter((m) => m.email !== emailToRemove));
  };

  const handleSubmit = async(e:React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try{
      const data = await projectApi.updateProject(String(project.id), {
        projectname: name,
        description
      });
      for(const member of members){
        try{
          await projectApi.addMember(String(project.id), member.email, member.role);
        }
        catch(error){
          console.log(`Failed to add member ${member.email}:`, error);
          //have to show the user failed to add a member.
        }
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
          {members.length > 0 && (
            <ul className={styles.memberList}>
              {members.map((member) => (
                <li key={member.email} className={styles.memberItem}>
                  <span>
                    <strong>{member.email}</strong>
                    <span className={styles.memberRole}>
                      {member.role.replace('PROJECT_', '')}
                    </span>
                  </span>
                  <button 
                    type="button" 
                    className={styles.removeBtn}
                    onClick={() => handleRemoveMember(member.email)}
                  >
                    Remove
                  </button>
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
