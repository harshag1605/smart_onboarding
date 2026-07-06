import Groq from 'groq-sdk';
import { User, Task } from './models.js';

let groq = null;

const PREDEFINED_DESIGNATIONS = [
  "Frontend Engineer",
  "Backend Engineer",
  "Fullstack Developer",
  "UI/UX Designer",
  "QA Engineer",
  "Automation Tester",
  "DevOps Engineer",
  "Cloud Architect",
  "Security Engineer",
  "Database Administrator",
  "Performance Optimizer",
  "Build & Release Engineer",
  "Mobile App Developer",
  "Product Manager",
  "Scrum Master",
  "Tech Lead",
  "Data Engineer",
  "Site Reliability Engineer",
  "Systems Administrator",
  "Documentation Specialist"
];

export function getGroqClient() {
  if (!groq) {
    const key = process.env.GROQ_API_KEY;
    if (!key) {
      throw new Error('GROQ_API_KEY environment variable is missing');
    }
    groq = new Groq({ apiKey: key });
  }
  return groq;
}

export async function generateAndAssignTasks(documentId, documentText) {
  const groqClient = getGroqClient();

  const prompt = `You are an HR onboarding assistant.

Input:
- Company onboarding document text:
${documentText.substring(0, 4000)}

- Predefined List of 20 designations:
${JSON.stringify(PREDEFINED_DESIGNATIONS, null, 2)}

Analyze the onboarding document and generate onboarding tasks.
Map each task to one of the 20 designations listed above. For example:
- Frontend tasks to "Frontend Engineer"
- Backend tasks to "Backend Engineer"
- CI/CD tasks to "DevOps Engineer" or "Site Reliability Engineer" or "Build & Release Engineer"
- Testing tasks to "QA Engineer" or "Automation Tester"
- Optimising tasks to "Performance Optimizer"
- General coordination to "Scrum Master" or "Product Manager"
- System/Infrastructure to "Systems Administrator" or "Cloud Architect"
- Documentation to "Documentation Specialist"

For every task return:
- title: String
- description: String
- priority: High, Medium, or Low
- estimatedTime: String (e.g. "1 hour", "30 mins")
- requiredDesignation: String (must be EXACTLY one of the 20 designations listed above)

Return ONLY valid JSON in this exact structure:
{
  "tasks": [
    {
      "title": "Setup local environment",
      "description": "Install dependencies, clone repo...",
      "priority": "High",
      "estimatedTime": "2 hours",
      "requiredDesignation": "Frontend Engineer"
    }
  ]
}
`;

  console.log('Sending prompt to Groq API...');

  const chatCompletion = await groqClient.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.1-8b-instant',
    response_format: { type: 'json_object' }
  });

  const content = chatCompletion.choices[0]?.message?.content;
  console.log('Groq response:', content);

  if (!content) throw new Error('Failed to generate tasks from AI');

  const parsed = JSON.parse(content);
  const tasks = parsed.tasks || [];

  console.log(`AI generated ${tasks.length} tasks`);

  for (const task of tasks) {
    await Task.create({
      title: task.title,
      description: task.description,
      priority: task.priority || 'Medium',
      estimatedTime: task.estimatedTime || '1 hour',
      requiredDesignation: task.requiredDesignation,
      assignedEmployee: null,
      status: 'Todo',
      isNullCluster: true,
      documentId: documentId
    });

    console.log(`Task "${task.title}" -> Created as unassigned (Draft Project)`);
  }
}
