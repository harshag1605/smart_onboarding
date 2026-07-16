import 'dotenv/config';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../src/models.js';
import { connectDB } from '../src/db.js';
import { checkDb, authMiddleware } from '../src/middleware.js';
import { autoAssignTasks } from '../src/taskUtils.js';

const app = express();
app.use(express.json());

connectDB();

app.post('/api/auth/register', checkDb, async (req, res) => {
  try {
    const { name, email, password, role, designations, department, group } = req.body;
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    if (role === 'employee') {
      if (!designations || designations.length === 0) return res.status(400).json({ error: 'At least one designation is required for employees' });
      if (!department) return res.status(400).json({ error: 'Department is required for employees' });
      if (!group) return res.status(400).json({ error: 'Group is required for employees' });
    }

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

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Auth Server running on http://localhost:${PORT}`);
});
