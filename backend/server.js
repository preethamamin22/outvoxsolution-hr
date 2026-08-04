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
const PORT = 5000;
const JWT_SECRET = 'outvox-super-secret-key';

app.use(cors());
app.use(express.json());

// Serve static files from the React frontend build folder
app.use(express.static(path.join(__dirname, '../build')));

// Root route to prevent "Cannot GET /"
app.get('/', (req, res) => {
  res.send('OutvoxHR Backend API is running successfully! Access the dashboard via your Vite frontend (usually http://localhost:5173)');
});

// --- Auth Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  // Check against the requested admin credentials
  if (email === 'Outvoxsolution' && password === 'Preetham@22') {
    let user = await prisma.user.findUnique({ where: { email: 'Outvoxsolution' } });
    
    // Ensure the admin user exists in DB
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'Outvoxsolution',
          password: 'hashed-password-placeholder',
          name: 'Preetham',
          role: 'ADMIN'
        }
      });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { name: user.name, username: user.email, role: user.role } });
  }

  // Check if it's an Agent logging in with their employee email
  const employee = await prisma.employee.findUnique({ where: { email } });
  if (employee) {
    // For demo purposes, any password works for an existing agent email
    const token = jwt.sign({ userId: employee.id, role: 'AGENT' }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: { id: employee.id, name: employee.fullName, username: employee.email, role: 'AGENT' } });
  }

  // Reject any other credentials
  return res.status(401).json({ error: 'Invalid username or password' });
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
    
    // Create Ethereal test account on the fly for development
    const testAccount = await nodemailer.createTestAccount();
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });

    const info = await transporter.sendMail({
      from: '"Outvox HR" <hr@outvoxsolution.com>',
      to: candidateEmail,
      subject: `Offer of Employment: ${role} at Outvox Solution`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; border: 1px solid #0056b3;">
          
          <!-- Header Banner -->
          <div style="background-color: #ff5722; padding: 15px 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">OUTVOX SOLUTION</h1>
          </div>

          <div style="padding: 40px; position: relative;">
            
            <!-- Logo area -->
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="background-color: #000; display: inline-block; padding: 20px; border-radius: 8px;">
                <h2 style="color: #ff5722; margin: 0;">OUTVOX</h2>
                <p style="color: #06B6D4; margin: 0; font-size: 12px; letter-spacing: 2px;">SOLUTION</p>
              </div>
              <h2 style="color: #0056b3; margin-top: 15px; font-size: 28px;">OFFER LETTER</h2>
            </div>

            <!-- Date and Details -->
            <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
            
            <p style="margin-bottom: 5px;"><strong>To,</strong></p>
            <p style="margin: 0; font-weight: bold;">${candidateName}</p>
            <p style="margin: 0;">Email: ${candidateEmail}</p>
            
            <p style="margin-top: 20px;"><strong>Subject: Appointment as ${role}</strong></p>
            
            <p>Dear <strong>${candidateName}</strong>,</p>
            
            <p>We are pleased to offer you an opportunity to join <strong>Outvox Solution</strong> as a <strong>${role}</strong> on a contractual and performance-based engagement.</p>
            
            <p><strong>Engagement Details</strong><br/>
            • Position: ${role}<br/>
            • Work Mode: Remote / Freelance<br/>
            • Joining: Immediate<br/>
            • Reporting To: Operations Team, Outvox Solution</p>
            
            <p><strong>Scope of Work</strong><br/>
            You will contact prospective riders, explain onboarding procedures, assist with registrations, maintain call records, and complete a minimum of <strong>100 outbound calls per day</strong> during active campaigns.</p>
            
            <p><strong>Compensation</strong><br/>
            • Incentive: <strong>${salary}</strong><br/>
            • Eligibility: Minimum 1 completed login and 10 successful rider orders.</p>
            
            <p><strong>Terms & Conditions</strong><br/>
            1. This is a freelance engagement and shall not be construed as employment.<br/>
            2. No fixed salary, PF, ESI, gratuity, insurance, or employee benefits are applicable.<br/>
            3. Incentives are payable only after successful verification of conversions.<br/>
            4. Confidential company information must not be disclosed to third parties.<br/>
            5. Daily target of 100 calls is mandatory unless otherwise approved by management.<br/>
            6. Failure to meet performance standards may affect incentive eligibility and continuation of assignments.<br/>
            7. Outvox Solution reserves the right to modify project requirements and incentive structures.<br/>
            8. Either party may terminate this engagement at any time.</p>
            
            <p>By accepting this offer, you acknowledge and agree to all terms and conditions stated herein.</p>
            <p>We look forward to a successful association with you.</p>
            
            <br/><br/>
            <p style="font-style: italic; font-weight: bold;">For Outvox Solution</p>
            <br/><br/><br/>
            
            <p style="margin:0; font-weight: bold;">Prashanth Lobo</p>
            <p style="margin:0;">Founder</p>
            <br/>
            <p style="margin:0;">Authorized Signature: _______________________</p>
            <p style="margin:0;">Company Seal: _______________________</p>
            
            <br/><br/>
            <p style="font-weight: bold; font-style: italic;">Candidate Acceptance</p>
            <p>I, <strong>${candidateName}</strong>, accept the terms and conditions of this engagement.</p>
            <p style="margin:0;">Signature: _______________________</p>
            <p style="margin:0;">Date: _______________________</p>
            
          </div>
          
          <!-- Footer Banner -->
          <div style="background-color: #0056b3; padding: 10px 20px; text-align: center; color: white; font-size: 12px;">
            Outvox Solution | prashanth@outvoxsolution.com | OutvoxSolution.com
          </div>
        </div>
      `
    });

    // Save to DB
    const offer = await prisma.offerLetter.create({
      data: { candidateName, candidateEmail, role, salary }
    });

    res.json({
      offer,
      message: 'Offer letter sent successfully',
      previewUrl: nodemailer.getTestMessageUrl(info) // URL to view the fake email
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to send offer letter' });
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
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

async function seedDatabase() {
  try {
    const count = await prisma.employee.count();
    if (count > 0) return; // Skip seeding if data already exists
    
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
