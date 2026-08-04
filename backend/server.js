import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const app = express();
const prisma = new PrismaClient();
const PORT = 5000;
const JWT_SECRET = 'outvox-super-secret-key';

app.use(cors());
app.use(express.json());

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // For demo purposes, any login works and creates a token. 
  // In production, you would verify against the DB.
  let user = await prisma.user.findUnique({ where: { email } });
  
  if (!user) {
    // Auto-create dummy user for easy testing
    user = await prisma.user.create({
      data: {
        email,
        password: 'hashed-password',
        name: 'Demo User',
        role: 'HR'
      }
    });
  }

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user: { name: user.name, email: user.email, role: user.role } });
});

// --- Dashboard Routes ---
app.get('/api/dashboard/kpis', async (req, res) => {
  try {
    // Real implementation would query DB. Here we provide mock data with realistic structure
    const totalEmployees = await prisma.employee.count();
    
    // If DB is empty, seed it with dummy data quickly
    if (totalEmployees === 0) {
      await seedDatabase();
    }
    
    const count = await prisma.employee.count();
    const active = await prisma.employee.count({ where: { status: 'Active' } });

    res.json({
      totalEmployees: count,
      presentToday: Math.floor(count * 0.95), // 95% present
      absent: Math.floor(count * 0.05), // 5% absent
      lateCheckins: 12,
      newJoiners: 5,
      onLeave: 4,
      openPositions: 8,
      pendingApprovals: 15
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch KPIs' });
  }
});

app.get('/api/dashboard/charts', async (req, res) => {
  // Dummy data for charts
  res.json({
    attendanceTrend: [
      { name: 'Mon', present: 140, absent: 10 },
      { name: 'Tue', present: 145, absent: 5 },
      { name: 'Wed', present: 135, absent: 15 },
      { name: 'Thu', present: 148, absent: 2 },
      { name: 'Fri', present: 142, absent: 8 },
    ],
    departmentDistribution: [
      { name: 'Engineering', value: 45, color: '#4F46E5' },
      { name: 'Marketing', value: 25, color: '#06B6D4' },
      { name: 'Sales', value: 35, color: '#22C55E' },
      { name: 'HR', value: 15, color: '#F59E0B' },
      { name: 'Finance', value: 10, color: '#EF4444' },
    ]
  });
});

// --- Employee Routes ---
app.get('/api/employees', async (req, res) => {
  try {
    const employees = await prisma.employee.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.post('/api/employees', async (req, res) => {
  try {
    const { empId, fullName, email, department, designation } = req.body;
    const newEmployee = await prisma.employee.create({
      data: {
        empId,
        fullName,
        email,
        department,
        designation,
      }
    });
    res.json(newEmployee);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// --- Task Routes ---
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: {
        assignee: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, priority, assigneeId, dueDate } = req.body;
    const newTask = await prisma.task.create({
      data: {
        title,
        description,
        priority,
        assigneeId: parseInt(assigneeId),
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        assignee: true
      }
    });
    res.json(newTask);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

async function seedDatabase() {
  const depts = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance'];
  for(let i = 1; i <= 150; i++) {
    await prisma.employee.create({
      data: {
        empId: `EMP${i.toString().padStart(3, '0')}`,
        fullName: `Employee ${i}`,
        email: `emp${i}@outvox.com`,
        department: depts[i % depts.length],
        designation: 'Staff',
        joiningDate: new Date(),
        status: 'Active'
      }
    });
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
