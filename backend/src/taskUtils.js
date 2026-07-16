import { Task, Team, Document } from './models.js';

export const autoAssignTeamTasks = async (documentId, teamId) => {
  const tasksToAssign = await Task.find({ documentId, status: 'Todo' });
  const team = await Team.findById(teamId).populate('members.employee');
  if (!team) return;

  const roleToEmployees = {};
  
  team.members.forEach(member => {
    const emp = member.employee;
    if (emp && emp.workingStatus === 'Available') {
      const roles = (member.overrideRole && member.overrideRole.length > 0) ? member.overrideRole : emp.designations;
      roles.forEach(role => {
        if (!roleToEmployees[role]) roleToEmployees[role] = [];
        roleToEmployees[role].push(emp._id.toString());
      });
    }
  });

  const tasksByRole = {};
  for (const task of tasksToAssign) {
    if (!tasksByRole[task.requiredDesignation]) {
      tasksByRole[task.requiredDesignation] = [];
    }
    tasksByRole[task.requiredDesignation].push(task);
  }

  for (const role in tasksByRole) {
    const roleTasks = tasksByRole[role];
    const availableEmps = roleToEmployees[role] || [];
    
    if (availableEmps.length > 0) {
      for (let i = 0; i < roleTasks.length; i++) {
        const task = roleTasks[i];
        const empId = availableEmps[i % availableEmps.length];
        
        task.assignedEmployee = empId;
        task.isNullCluster = false;
        await task.save();
      }
    } else {
      for (const task of roleTasks) {
        task.assignedEmployee = null;
        task.isNullCluster = true;
        await task.save();
      }
    }
  }
};

export const autoAssignTasks = async () => {
  const docs = await Document.find({ status: 'Live', teamId: { $ne: null } });
  for (const doc of docs) {
    await autoAssignTeamTasks(doc._id, doc.teamId);
  }
};
