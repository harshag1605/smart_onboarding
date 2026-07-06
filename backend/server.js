import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { User, Group, Task, Document, Team } from './src/models.js';
import { generateAndAssignTasks } from './src/ai.js';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const upload = multer({ storage: multer.memoryStorage() });

let isDbConnected = false;
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      isDbConnected = true;
      console.log('Connected to MongoDB');
    })
    .catch(err => console.error('MongoDB connection error:', err));
}

const checkDb = (req, res, next) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database not connected. Please set MONGO_URI.' });
  }
  next();
};

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

const autoAssignTeamTasks = async (documentId, teamId) => {
  // Fetch ALL Todo tasks so we can re-balance them when team members change
  const tasksToAssign = await Task.find({ documentId, status: 'Todo' });
  const team = await Team.findById(teamId).populate('members.employee');
  if (!team) return;

  // Build a map of required role -> array of capable employees
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

  // Group tasks by role
  const tasksByRole = {};
  for (const task of tasksToAssign) {
    if (!tasksByRole[task.requiredDesignation]) {
      tasksByRole[task.requiredDesignation] = [];
    }
    tasksByRole[task.requiredDesignation].push(task);
  }

  // Divide tasks evenly for each role
  for (const role in tasksByRole) {
    const roleTasks = tasksByRole[role];
    const availableEmps = roleToEmployees[role] || [];
    
    if (availableEmps.length > 0) {
      // Distribute tasks round-robin strictly among employees capable of this role
      for (let i = 0; i < roleTasks.length; i++) {
        const task = roleTasks[i];
        const empId = availableEmps[i % availableEmps.length];
        
        task.assignedEmployee = empId;
        task.isNullCluster = false;
        await task.save();
      }
    } else {
      // If no capable employee is found, unassign it so it goes to Open
      for (const task of roleTasks) {
        task.assignedEmployee = null;
        task.isNullCluster = true;
        await task.save();
      }
    }
  }
};

const autoAssignTasks = async () => {
  // Global auto-assign fallback if needed, but primarily we rely on autoAssignTeamTasks now.
  const docs = await Document.find({ status: 'Live', teamId: { $ne: null } });
  for (const doc of docs) {
    await autoAssignTeamTasks(doc._id, doc.teamId);
  }
};

app.post('/api/auth/register', checkDb, async (req, res) => {
  try {
    const { name, email, password, role, designations, department, group } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({
      name, email, password: hashedPassword, role,
      designations: designations || [],
      department: department || null,
      group: group || null
    });

    await autoAssignTasks();

    res.json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/auth/login', checkDb, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback_secret',
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
        designations: user.designations,
        department: user.department,
        group: user.group,
        workingStatus: user.workingStatus
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/auth/me', checkDb, authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

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

app.get('/api/hr/documents', checkDb, authMiddleware, async (req, res) => {
  try {
    const docs = await Document.find().populate('teamId').sort({ uploadedAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/upload', checkDb, authMiddleware, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { originalname, buffer, mimetype } = req.file;
    const title = req.body.title || originalname;

    let textContent = '';
    if (mimetype === 'application/pdf') {
      const data = await pdfParse(buffer);
      textContent = data.text;
    } else if (mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const data = await mammoth.extractRawText({ buffer });
      textContent = data.value;
    } else {
      textContent = buffer.toString('utf-8');
    }

    const doc = await Document.create({ title, name: originalname, content: textContent });

    await generateAndAssignTasks(doc._id, textContent);

    res.json({ message: 'Document processed and tasks assigned successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/hr/null-cluster', checkDb, authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ isNullCluster: true });
    res.json(tasks);
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
    
    // Auto-assign tasks to the newly assigned team
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

// Teams CRUD
app.get('/api/hr/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find().populate('members.employee', 'name email designations workingStatus');
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/hr/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    const team = await Team.create({ name, members: [] });
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
    
    // Check if already in team
    if (!team.members.some(m => m.employee.toString() === employeeId)) {
      team.members.push({ employee: employeeId, overrideRole: overrideRole || [] });
      await team.save();
      await autoAssignTasks(); // Re-trigger assignments for all live docs of this team
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
      
      // Since role changed, we should probably unassign tasks for this employee if they no longer match,
      // but for simplicity, we just trigger reassign for unassigned tasks.
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
      // Unassign tasks assigned to this employee for documents managed by this team
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

app.get('/api/hr/tasks', checkDb, authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find().populate('assignedEmployee', 'name designations');
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
    });
    
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
      });
      clusterTasks.push(...tasks);
    }
    
    // Set status to 'Open' for unassigned tasks so they appear in a separate column
    const formattedClusterTasks = clusterTasks.map(t => ({ ...t.toObject(), status: 'Open' }));
    
    res.json([...assignedTasks, ...formattedClusterTasks]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/employee/teams', checkDb, authMiddleware, async (req, res) => {
  try {
    const teams = await Team.find({ 'members.employee': req.user.id });
    // Also attach live projects assigned to this team
    const enrichedTeams = await Promise.all(teams.map(async team => {
      const projects = await Document.find({ teamId: team._id, status: 'Live' }).select('title status');
      const memberInfo = team.members.find(m => m.employee.toString() === req.user.id);
      return { ...team.toObject(), projects, myRole: memberInfo?.overrideRole };
    }));
    res.json(enrichedTeams);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
