import 'dotenv/config';
import express from 'express';
import { User, Group, Task, Document, Team } from '../src/models.js';
import { connectDB } from '../src/db.js';
import { checkDb, authMiddleware } from '../src/middleware.js';
import { autoAssignTasks, autoAssignTeamTasks } from '../src/taskUtils.js';

const app = express();
app.use(express.json());
connectDB();

// Employee endpoints
app.get('/api/hr/employees', checkDb, authMiddleware, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/hr/employees/:id', checkDb, authMiddleware, async (req, res) => {
  try {
    const { name, email, department, group, designations, workingStatus } = req.body;
    const employee = await User.findByIdAndUpdate(req.params.id, {
      name, email, department, group, designations, workingStatus
    }, { new: true });

    await autoAssignTasks();

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hr/employees/:id', checkDb, authMiddleware, async (req, res) => {
  try {
    await Task.updateMany({ assignedEmployee: req.params.id }, { assignedEmployee: null, isNullCluster: true });
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Group endpoints
app.get('/api/hr/groups', checkDb, authMiddleware, async (req, res) => {
  try {
    const groups = await Group.find();
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/groups', checkDb, authMiddleware, async (req, res) => {
  try {
    const { name, designations } = req.body;
    const group = await Group.create({ name, designations });
    res.json(group);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Document endpoints (excluding upload)
app.get('/api/hr/documents', checkDb, authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ createdBy: req.user.id }).populate('teamId').sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hr/documents/:id', checkDb, authMiddleware, async (req, res) => {
  try {
    await Task.deleteMany({ documentId: req.params.id });
    await Document.findByIdAndDelete(req.params.id);
    res.json({ message: 'Document and its tasks deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/documents/:id/live', checkDb, authMiddleware, async (req, res) => {
  try {
    const { teamId } = req.body;
    const doc = await Document.findByIdAndUpdate(req.params.id, { status: 'Live', teamId }, { new: true });
    
    await autoAssignTeamTasks(doc._id, teamId);
    
    res.json({ message: 'Document is now Live and tasks assigned to the team.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/documents/:id/reassign', checkDb, authMiddleware, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (doc && doc.teamId) {
      await autoAssignTeamTasks(doc._id, doc.teamId);
    }
    res.json({ message: 'Auto reassignment completed for this document.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Null Cluster and Tasks
app.get('/api/hr/null-cluster', checkDb, authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ isNullCluster: true });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hr/tasks', checkDb, authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find({ createdBy: req.user.id }).select('_id');
    const tasks = await Task.find({ documentId: { $in: docs.map(d => d._id) } }).populate('assignedEmployee', 'name designations');
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hr/tasks/:id', checkDb, authMiddleware, async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Teams CRUD
app.get('/api/hr/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ createdBy: req.user.id }).populate('members.employee', 'name email designations workingStatus');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const team = await Team.create({ name, createdBy: req.user.id, members: [] });
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/teams/:id/members', checkDb, authMiddleware, async (req, res) => {
  try {
    const { employeeId, overrideRole } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    if (!team.members.some(m => m.employee.toString() === employeeId)) {
      team.members.push({ employee: employeeId, overrideRole: overrideRole || [] });
      await team.save();
      await autoAssignTasks();
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/hr/teams/:id/members/:memberId', checkDb, authMiddleware, async (req, res) => {
  try {
    const { overrideRole } = req.body;
    const team = await Team.findById(req.params.id);
    const member = team.members.id(req.params.memberId);
    if (member) {
      member.overrideRole = overrideRole;
      await team.save();
      await autoAssignTasks();
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hr/teams/:id/members/:memberId', checkDb, authMiddleware, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    const member = team.members.id(req.params.memberId);
    
    if (member) {
      const docs = await Document.find({ teamId: team._id });
      for (const doc of docs) {
        await Task.updateMany({ documentId: doc._id, assignedEmployee: member.employee }, { assignedEmployee: null, isNullCluster: true });
      }
      team.members.pull(req.params.memberId);
      await team.save();
      await autoAssignTasks();
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/hr/teams/:id', checkDb, authMiddleware, async (req, res) => {
  try {
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Analytics
app.get('/api/hr/analytics/performers', checkDb, authMiddleware, async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'Done', assignedEmployee: { $ne: null } }).populate('assignedEmployee', 'name email');
    const counts = {};
    completedTasks.forEach(t => {
      const empId = t.assignedEmployee._id.toString();
      if (!counts[empId]) {
        counts[empId] = { employee: t.assignedEmployee, score: 0 };
      }
      counts[empId].score++;
    });
    const performers = Object.values(counts).sort((a, b) => b.score - a.score);
    res.json(performers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employee/analytics/performers', checkDb, authMiddleware, async (req, res) => {
  try {
    const completedTasks = await Task.find({ status: 'Done', assignedEmployee: { $ne: null } }).populate('assignedEmployee', 'name email designations');
    const counts = {};
    completedTasks.forEach(t => {
      const empId = t.assignedEmployee._id.toString();
      if (!counts[empId]) {
        counts[empId] = { employee: t.assignedEmployee, score: 0 };
      }
      counts[empId].score++;
    });
    const performers = Object.values(counts).sort((a, b) => b.score - a.score);
    res.json(performers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employee specific endpoints
app.get('/api/employee/tasks', checkDb, authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    const userTeams = await Team.find({ 'members.employee': req.user.id });
    const teamIds = userTeams.map(t => t._id);
    
    const docs = await Document.find({ teamId: { $in: teamIds }, status: 'Live' });
    const docIds = docs.map(d => d._id);

    const assignedTasks = await Task.find({ 
      assignedEmployee: req.user.id,
      documentId: { $in: docIds }
    }).populate({ path: 'documentId', select: 'createdBy title teamId', populate: [ { path: 'createdBy', select: 'name' }, { path: 'teamId', select: 'name' } ] });
    
    const clusterTasks = [];
    for (const doc of docs) {
      const team = userTeams.find(t => t._id.toString() === doc.teamId.toString());
      if (!team) continue;
      
      const member = team.members.find(m => m.employee.toString() === req.user.id);
      if (!member) continue;
      
      const allowedRoles = member.overrideRole?.length > 0 ? member.overrideRole : (user.designations || []);
      
      const tasks = await Task.find({
        assignedEmployee: null,
        documentId: doc._id,
        requiredDesignation: { $in: allowedRoles }
      }).populate({ path: 'documentId', select: 'createdBy title teamId', populate: [ { path: 'createdBy', select: 'name' }, { path: 'teamId', select: 'name' } ] });
      clusterTasks.push(...tasks);
    }
    
    const formattedClusterTasks = clusterTasks.map(t => ({ ...t.toObject(), status: 'Open' }));
    
    res.json([...assignedTasks, ...formattedClusterTasks]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employee/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ 'members.employee': req.user.id });
    const enrichedTeams = await Promise.all(teams.map(async team => {
      const projects = await Document.find({ teamId: team._id, status: 'Live' }).select('title status createdBy').populate('createdBy', 'name');
      const memberInfo = team.members.find(m => m.employee.toString() === req.user.id);
      return { ...team.toObject(), projects, myRole: memberInfo?.overrideRole };
    }));
    res.json(enrichedTeams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employee/tasks/:id/status', checkDb, authMiddleware, async (req, res) => {
  try {
    const { status } = req.body;
    let updateData = { status };
    
    if (status !== 'Open') {
      updateData.assignedEmployee = req.user.id;
      updateData.isNullCluster = false;
    } else {
      updateData.assignedEmployee = null;
      updateData.isNullCluster = true;
    }
    
    const task = await Task.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employee/status', checkDb, authMiddleware, async (req, res) => {
  try {
    const { workingStatus } = req.body;
    const user = await User.findByIdAndUpdate(req.user.id, { workingStatus }, { new: true });
    await autoAssignTasks();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/employee/profile', checkDb, authMiddleware, async (req, res) => {
  try {
    const { name, department, group, designations } = req.body;
    
    if (!designations || designations.length === 0) return res.status(400).json({ error: 'At least one designation is required' });
    if (!department) return res.status(400).json({ error: 'Department is required' });
    if (!group) return res.status(400).json({ error: 'Group is required' });

    const user = await User.findByIdAndUpdate(req.user.id, {
      name, department, group, designations
    }, { new: true }).select('-password');

    await autoAssignTasks();
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`CRUD Server running on http://localhost:${PORT}`);
});
