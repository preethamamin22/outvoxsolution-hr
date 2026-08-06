import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5001;
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Serve static files from the React frontend build folder
app.use(express.static(path.join(__dirname, '../dist')));

// Root route to prevent "Cannot GET /"
app.get('/', (req, res) => {
  res.send('OutvoxHR Backend API is running successfully! Access the dashboard via your Vite frontend (usually http://localhost:5173)');
});

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  // Hardcoded admin fallback - always works regardless of DB state
  if (email === 'Outvoxsolution' && password === 'Preetham@22') {
    // Upsert admin into DB
    let admin = await prisma.user.findUnique({ where: { email: 'Outvoxsolution' } });
    if (!admin) {
      admin = await prisma.user.create({
        data: { email: 'Outvoxsolution', password: 'Preetham@22', name: 'Preetham', role: 'ADMIN' }
      });
    }
    const token = jwt.sign({ userId: admin.id, role: 'ADMIN' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { name: admin.name, username: admin.email, role: 'ADMIN', avatar: admin.avatar } });
  }

  // Check DB for any user (employees)
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.password === password) {
    if (user.role === 'EMPLOYEE') {
      const employee = await prisma.employee.findUnique({ where: { email } });
      if (employee) {
        const token = jwt.sign({ userId: employee.id, role: 'AGENT' }, JWT_SECRET, { expiresIn: '24h' });
        return res.json({ token, user: { id: employee.id, name: employee.fullName, username: employee.email, role: 'AGENT', avatar: employee.avatar } });
      }
    }
  }

  // Reject any other credentials
  return res.status(401).json({ error: 'Invalid username or password' });
});

// Update Profile (including avatar)
app.put('/api/user/profile', async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      const updatedUser = await prisma.user.update({
        where: { email },
        data: { name, avatar }
      });

      if (user.role === 'EMPLOYEE') {
        await prisma.employee.update({
          where: { email },
          data: { fullName: name, avatar }
        });
      }
      return res.json({ name: updatedUser.name, username: updatedUser.email, role: user.role, avatar: updatedUser.avatar });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (employee) {
      const updatedEmployee = await prisma.employee.update({
        where: { email },
        data: { fullName: name, avatar }
      });
      // also update user table if user exists
      const associatedUser = await prisma.user.findUnique({ where: { email } });
      if (associatedUser) {
        await prisma.user.update({
          where: { email },
          data: { name, avatar }
        });
      }
      return res.json({ id: updatedEmployee.id, name: updatedEmployee.fullName, username: updatedEmployee.email, role: 'AGENT', avatar: updatedEmployee.avatar });
    }

    res.status(404).json({ error: 'User not found' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
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
    
    // Ensure user login is also created
    await prisma.user.create({
      data: {
        email: email,
        password: 'Employee@123',
        name: fullName,
        role: 'EMPLOYEE'
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

// --- Attendance Routes ---
app.get('/api/attendance', async (req, res) => {
  try {
    // Return today's attendance records with employee details
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const records = await prisma.attendanceRecord.findMany({
      where: {
        date: {
          gte: today
        }
      },
      include: { employee: true },
      orderBy: { clockIn: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

app.post('/api/attendance/clock-in', async (req, res) => {
  try {
    const { employeeId } = req.body;
    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: parseInt(employeeId),
        clockIn: new Date(),
        status: 'Present'
      },
      include: { employee: true }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Clock-in failed' });
  }
});

app.post('/api/attendance/clock-out', async (req, res) => {
  try {
    const { recordId } = req.body;
    const record = await prisma.attendanceRecord.update({
      where: { id: parseInt(recordId) },
      data: { clockOut: new Date() },
      include: { employee: true }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: 'Clock-out failed' });
  }
});

// --- Recruitment / Offer Letter Routes ---
app.get('/api/recruitment/offers', async (req, res) => {
  try {
    const offers = await prisma.offerLetter.findMany({
      orderBy: { sentAt: 'desc' }
    });
    res.json(offers);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

app.post('/api/recruitment/send-offer', async (req, res) => {
  try {
    const { candidateName, candidateEmail, role, salary } = req.body;
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

    const offerHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 2px solid #0056b3;">
        <div style="background: linear-gradient(135deg, #ff5722, #e64a19); padding: 20px 30px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h1 style="color: white; margin: 0; font-size: 28px; letter-spacing: 2px;">OUTVOX SOLUTION</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 13px; letter-spacing: 1px;">OFFICIAL OFFER LETTER</p>
          </div>
          <div style="background: white; padding: 8px 16px; border-radius: 6px;">
            <span style="color: #ff5722; font-weight: bold; font-size: 14px;">OUTVOX</span>
            <span style="color: #0056b3; font-size: 14px;"> HR</span>
          </div>
        </div>

        <div style="padding: 40px 50px; background: white; color: #333;">
          <p style="text-align: right; color: #666;"><strong>Date:</strong> ${dateStr}</p>
          <p style="margin-bottom: 4px;"><strong>To,</strong></p>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${candidateName}</p>
          <p style="margin: 4px 0 24px; color: #555;">Email: ${candidateEmail}</p>

          <p style="font-size: 16px; font-weight: bold; border-bottom: 2px solid #ff5722; padding-bottom: 8px; color: #0056b3;">Subject: Appointment as ${role}</p>

          <p>Dear <strong>${candidateName}</strong>,</p>
          <p>We are pleased to offer you an opportunity to join <strong>Outvox Solution</strong> as a <strong>${role}</strong> on a contractual and performance-based engagement.</p>

          <div style="background: #f8f9fa; border-left: 4px solid #ff5722; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="font-weight: bold; margin: 0 0 10px; color: #0056b3;">Engagement Details</p>
            <p style="margin: 4px 0;">• <strong>Position:</strong> ${role}</p>
            <p style="margin: 4px 0;">• <strong>Work Mode:</strong> Remote / Freelance</p>
            <p style="margin: 4px 0;">• <strong>Joining:</strong> Immediate</p>
            <p style="margin: 4px 0;">• <strong>Reporting To:</strong> Operations Team, Outvox Solution</p>
          </div>

          <div style="background: #f8f9fa; border-left: 4px solid #0056b3; padding: 16px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <p style="font-weight: bold; margin: 0 0 10px; color: #0056b3;">Compensation</p>
            <p style="margin: 4px 0;">• <strong>Incentive:</strong> ${salary}</p>
            <p style="margin: 4px 0;">• <strong>Eligibility:</strong> Minimum 1 completed login and 10 successful rider orders.</p>
          </div>

          <p><strong>Scope of Work</strong><br/>You will contact prospective riders, explain onboarding procedures, assist with registrations, maintain call records, and complete a minimum of <strong>100 outbound calls per day</strong> during active campaigns.</p>

          <div style="border: 1px solid #ddd; padding: 16px 20px; margin: 20px 0; border-radius: 8px;">
            <p style="font-weight: bold; color: #0056b3; margin-top: 0;">Terms &amp; Conditions</p>
            <ol style="padding-left: 20px; color: #555; line-height: 1.8;">
              <li>This is a freelance engagement and shall not be construed as employment.</li>
              <li>No fixed salary, PF, ESI, gratuity, insurance, or employee benefits are applicable.</li>
              <li>Incentives are payable only after successful verification of conversions.</li>
              <li>Confidential company information must not be disclosed to third parties.</li>
              <li>Daily target of 100 calls is mandatory unless otherwise approved by management.</li>
              <li>Failure to meet performance standards may affect incentive eligibility.</li>
              <li>Outvox Solution reserves the right to modify project requirements and incentive structures.</li>
              <li>Either party may terminate this engagement at any time.</li>
            </ol>
          </div>

          <p>By accepting this offer, you acknowledge and agree to all terms and conditions stated herein.</p>
          <p>We look forward to a successful association with you.</p>

          <div style="display: flex; gap: 40px; margin-top: 50px;">
            <div style="flex: 1;">
              <p style="font-weight: bold; color: #0056b3; margin-bottom: 0;">For Outvox Solution</p>
              <br/><br/><br/>
              <p style="margin: 0; font-weight: bold;">Prashanth Lobo</p>
              <p style="margin: 0; color: #666;">Founder</p>
              <p style="margin: 8px 0 0; border-top: 1px solid #333; padding-top: 4px; color: #888;">Authorized Signature</p>
            </div>
            <div style="flex: 1;">
              <p style="font-weight: bold; color: #0056b3; margin-bottom: 0;">Candidate Acceptance</p>
              <p style="margin: 4px 0; color: #555;">I, <strong>${candidateName}</strong>, accept the terms and conditions.</p>
              <br/><br/>
              <p style="margin: 8px 0 0; border-top: 1px solid #333; padding-top: 4px; color: #888;">Candidate Signature &amp; Date</p>
            </div>
          </div>
        </div>

        <div style="background: #0056b3; padding: 12px 30px; text-align: center; color: white; font-size: 12px;">
          Outvox Solution | prashanth@outvoxsolution.com | OutvoxSolution.com
        </div>
      </div>
    `;

    // Save to DB
    const offer = await prisma.offerLetter.create({
      data: { candidateName, candidateEmail, role, salary }
    });

    // Return the HTML directly so frontend can display/print it
    res.json({
      offer,
      message: 'Offer letter generated successfully',
      offerHtml
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate offer letter' });
  }
});

// --- Agent Portal Routes ---
app.get('/api/agent/:id', async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const agent = await prisma.employee.findUnique({
      where: { id: agentId },
      include: {
        tasks: { orderBy: { createdAt: 'desc' } },
        dailyUpdates: { orderBy: { date: 'desc' }, take: 10 },
        attendance: { orderBy: { date: 'desc' }, take: 1 }
      }
    });
    res.json(agent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch agent profile' });
  }
});

app.put('/api/agent/:id', async (req, res) => {
  try {
    const { fullName, email } = req.body;
    const agentId = parseInt(req.params.id);
    const updatedAgent = await prisma.employee.update({
      where: { id: agentId },
      data: { fullName, email }
    });
    res.json(updatedAgent);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

app.post('/api/agent/:id/update', async (req, res) => {
  try {
    const { content } = req.body;
    const update = await prisma.dailyUpdate.create({
      data: {
        employeeId: parseInt(req.params.id),
        content
      }
    });
    res.json(update);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post update' });
  }
});

// --- Telecaller / Leads Routes ---
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await prisma.lead.findMany({
      include: { employee: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch leads' });
  }
});

app.post('/api/leads', async (req, res) => {
  try {
    const { name, phone, email, assignedTo } = req.body;
    const lead = await prisma.lead.create({
      data: { name, phone, email, assignedTo: parseInt(assignedTo) },
      include: { employee: true }
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create lead' });
  }
});

app.put('/api/leads/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const lead = await prisma.lead.update({
      where: { id: parseInt(req.params.id) },
      data: { status, notes },
      include: { employee: true }
    });
    res.json(lead);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

// Fallback to React index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

async function seedDatabase() {
  try {
    // Ensure Admin exists
    let admin = await prisma.user.findUnique({ where: { email: 'Outvoxsolution' } });
    if (!admin) {
      await prisma.user.create({
        data: {
          email: 'Outvoxsolution',
          password: 'Preetham@22',
          name: 'Preetham',
          role: 'ADMIN'
        }
      });
    }

    const count = await prisma.employee.count();
    if (count === 0) {
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
    
    // Ensure all employees have a User record for login
    const employees = await prisma.employee.findMany();
    for (const emp of employees) {
      const user = await prisma.user.findUnique({ where: { email: emp.email } });
      if (!user) {
        await prisma.user.create({
          data: {
            email: emp.email,
            password: 'Employee@123',
            name: emp.fullName,
            role: 'EMPLOYEE'
          }
        });
      }
    }
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

// Only listen to port if not running on Vercel Serverless
if (!process.env.VERCEL) {
  app.listen(process.env.PORT || PORT, () => {
    console.log(`Server is running on port ${process.env.PORT || PORT}`);
    seedDatabase();
  });
}

// Export the Express app for Vercel Serverless Functions
export default app;
