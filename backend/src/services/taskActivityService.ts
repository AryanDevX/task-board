import { prisma } from '../../lib/prisma.js';

//Sending notification to reporter and assignee while moving a task.
//Not notifying twice if both are same.
export const notifyStatusChanged = async(taskId: number, title: string, assigneeId: number | null, reporterId: number | null, userId: number): Promise<void> => {
    const usersToNotify = new Set<number>();
    
    // Not notifying who actually made the change:
    if(assigneeId && assigneeId !== userId) usersToNotify.add(assigneeId);
    if(reporterId && reporterId !== userId) usersToNotify.add(reporterId);

    const statusNotifications = Array.from(usersToNotify).map(targetUserId => ({
        userId: targetUserId, taskId, type: 'STATUS_CHANGED' as const, message: `The status of "${title}" was updated.`
    }));

    if(statusNotifications.length > 0){
        await prisma.notification.createMany({ data: statusNotifications });
    }
};

//Sending notification to a assignee of new task:
export const notifyTaskAssigned = async(taskId: number, title: string, assigneeId: number, userId: number): Promise<void> => {
    // Only notify if someone else assigned it to them
    if(assigneeId !== userId){
        await prisma.notification.create({
            data: { userId: assigneeId, taskId, type: 'TASK_ASSIGNED', message: `You were assigned to: "${title}"` }
        });
    }
};

//Merging comments and audit logs into single list for chronological order in UI.
export const buildActivityTimeline = (comments: any[], auditLogs: any[]): any[] => {
    const commentActivities = comments.map(comment => ({
        ActivityType: 'COMMENT' as const, timestamp: comment.createdAt, data: comment
    }));
    const auditActivities = auditLogs.map(log => ({
        ActivityType: 'AUDIT_LOG' as const, timestamp: log.createdAt, data: log
    }));
    
    // Sort descending (newest at top)
    return [...commentActivities, ...auditActivities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
};
