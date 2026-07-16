import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['hr', 'employee'], default: 'employee' },
  designations: [{ type: String }],
  department: { type: String, default: null },
  group: { type: String, default: null },
  workingStatus: { type: String, enum: ['Available', 'Busy', 'On Leave'], default: 'Available' },
});

const TaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], required: true },
  estimatedTime: { type: String, required: true },
  requiredDesignation: { type: String, required: true },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['Todo', 'In Progress', 'Done'], default: 'Todo' },
  isNullCluster: { type: Boolean, default: false },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', default: null }
});

const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  designations: [{ type: String }],
});

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    overrideRole: { type: [String], default: [] }
  }]
});

const DocumentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  name: { type: String, required: true },
  content: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['Draft', 'Live'], default: 'Draft' },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

export const User = mongoose.model('User', UserSchema);
export const Task = mongoose.model('Task', TaskSchema);
export const Group = mongoose.model('Group', GroupSchema);
export const Team = mongoose.model('Team', TeamSchema);
export const Document = mongoose.model('Document', DocumentSchema);
