import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
import mammoth from 'mammoth';
import { Document } from '../src/models.js';
import { generateAndAssignTasks } from '../src/ai.js';
import { connectDB } from '../src/db.js';
import { checkDb, authMiddleware } from '../src/middleware.js';

const app = express();
app.use(express.json());
connectDB();

const upload = multer({ storage: multer.memoryStorage() });

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

    const doc = await Document.create({ title, name: originalname, content: textContent, createdBy: req.user.id });

    await generateAndAssignTasks(doc._id, textContent);

    res.json({ message: 'Document processed and tasks assigned successfully' });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3002;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`AI Server running on http://localhost:${PORT}`);
});
