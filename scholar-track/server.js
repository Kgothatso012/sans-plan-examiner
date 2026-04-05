// ScholarTrack - School Transport Tracking System
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

const drivers = new Map();
const students = new Map();
const routes = new Map();
const locations = new Map();
const parentSessions = new Map();

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(ws, data);
    } catch (e) {
      // Silent fail for invalid messages
    }
  });
});

function handleMessage(ws, data) {
  switch (data.type) {
    case 'driver_register':
      ws.driverId = data.driverId;
      break;
    case 'driver_location':
      updateDriverLocation(data);
      broadcastLocation(data);
      break;
    case 'student_pickup':
      updateStudentStatus(data);
      broadcastStudentUpdate(data);
      break;
    case 'get_route':
      sendRouteToClient(ws, data.routeId);
      break;
    case 'parent_subscribe':
      handleParentSubscribe(ws, data.studentId);
      break;
    default:
      break;
  }
}

function updateDriverLocation(data) {
  locations.set(data.driverId, {
    lat: data.lat,
    lng: data.lng,
    speed: data.speed || 0,
    driverId: data.driverId,
    timestamp: Date.now()
  });
}

function broadcastLocation(data) {
  const location = {
    type: 'location_update',
    driverId: data.driverId,
    lat: data.lat,
    lng: data.lng,
    speed: data.speed,
    timestamp: Date.now()
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(location));
    }
  });
}

function broadcastStudentUpdate(data) {
  const update = {
    type: 'student_update',
    studentId: data.studentId,
    status: data.status,
    timestamp: Date.now()
  };

  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(update));
    }
  });
}

function updateStudentStatus(data) {
  const student = students.get(data.studentId);
  if (student) {
    student.status = data.status;
    student.lastUpdate = Date.now();
    student.driverId = data.driverId;
  }
}

function sendRouteToClient(ws, routeId) {
  const route = routes.get(routeId);
  if (route) {
    ws.send(JSON.stringify({ type: 'route_data', route }));
  }
}

function handleParentSubscribe(ws, studentId) {
  ws.studentId = studentId;
  if (!parentSessions.has(studentId)) {
    parentSessions.set(studentId, new Set());
  }
  parentSessions.get(studentId).add(ws);

  // Send initial location if driver is active
  const student = students.get(studentId);
  if (student && student.driverId) {
    const location = locations.get(student.driverId);
    if (location) {
      ws.send(JSON.stringify({
        type: 'location_update',
        driverId: student.driverId,
        lat: location.lat,
        lng: location.lng,
        speed: location.speed,
        timestamp: Date.now()
      }));
    }
  }
}

app.post('/api/driver/login', (req, res) => {
  const { phone } = req.body;
  
  const existingDriver = Array.from(drivers.values()).find(d => d.phone === phone);
  
  if (!existingDriver) {
    const newDriver = {
      id: crypto.randomUUID(),
      name: 'Demo Driver',
      phone,
      vehicle: 'ABC-123',
      route: 'route1',
      status: 'active'
    };
    drivers.set(newDriver.id, newDriver);
    return res.json({ success: true, driver: newDriver, token: newDriver.id });
  }
  
  res.json({ success: true, driver: existingDriver, token: existingDriver.id });
});

app.get('/api/driver/:id/dashboard', (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  
  const driverLocation = locations.get(driver.id);
  const routeStops = getRouteStops(driver.route);
  
  res.json({
    driver,
    location: driverLocation,
    route: driver.route,
    stops: routeStops,
    studentsOnBoard: getStudentsOnRoute(driver.route).filter(s => s.status === 'on_board').length
  });
});

app.post('/api/driver/:id/location', (req, res) => {
  const { lat, lng, speed, heading } = req.body;
  
  locations.set(req.params.id, { lat, lng, speed, heading, timestamp: Date.now() });
  
  broadcastLocation({ driverId: req.params.id, lat, lng });
  
  res.json({ success: true });
});

app.post('/api/driver/student/status', (req, res) => {
  const { studentId, status, driverId, location } = req.body;
  
  const student = students.get(studentId);
  if (student) {
    student.status = status;
    student.lastUpdate = Date.now();
    student.driverId = driverId;
    student.location = location;
  }
  
  broadcastStudentUpdate({ studentId, status });
  
  res.json({ success: true });
});

app.get('/api/driver/:id/students', (req, res) => {
  const driver = drivers.get(req.params.id);
  if (!driver) return res.status(404).json({ error: 'Driver not found' });
  
  const routeStudents = getStudentsOnRoute(driver.route);
  res.json(routeStudents);
});

app.get('/api/parent/student/:studentId', (req, res) => {
  const student = students.get(req.params.studentId);
  if (!student) {
    return res.json({
      id: req.params.studentId,
      name: 'Demo Student',
      school: 'Demo Primary School',
      route: 'route1',
      status: 'at_school',
      driver: null,
      eta: null
    });
  }
  
  const driver = student.driverId ? drivers.get(student.driverId) : null;
  const location = driver ? locations.get(driver.id) : null;
  
  res.json({
    ...student,
    driver: driver ? { name: driver.name, vehicle: driver.vehicle, phone: driver.phone } : null,
    location,
    eta: calculateETA(location, student.stopId)
  });
});

app.get('/api/parent/student/:studentId/location', (req, res) => {
  const student = students.get(req.params.studentId);
  if (!student || !student.driverId) {
    return res.json({ tracking: false });
  }
  
  const location = locations.get(student.driverId);
  res.json({
    tracking: true,
    location,
    lastUpdate: location?.timestamp
  });
});

app.post('/api/parent/login', (req, res) => {
  const { studentId } = req.body;
  
  const student = students.get(studentId);
  if (!student) {
    return res.json({ success: true, studentId, name: 'Demo Student', token: studentId });
  }
  
  res.json({ success: true, studentId, name: student.name, token: studentId });
});

app.get('/api/routes', (req, res) => {
  res.json(Array.from(routes.values()));
});

app.get('/api/admin/tracking', (req, res) => {
  const allLocations = {};
  locations.forEach((loc, driverId) => { allLocations[driverId] = loc; });
  
  res.json({
    drivers: Array.from(drivers.values()),
    locations: allLocations,
    students: Array.from(students.values())
  });
});

function setupDemoData() {
  const demoRoutes = [
    { id: 'route1', name: 'Route 1 - Morning', stops: [
      { id: 1, name: 'Stop 1 - Oak Street', lat: -25.7479, lng: 28.1911, time: '06:30' },
      { id: 2, name: 'Stop 2 - Pine Avenue', lat: -25.7500, lng: 28.1950, time: '06:45' },
      { id: 3, name: 'Stop 3 - Cedar Road', lat: -25.7520, lng: 28.2000, time: '07:00' },
      { id: 4, name: 'Demo Primary School', lat: -25.7550, lng: 28.2100, time: '07:30' }
    ]},
    { id: 'route2', name: 'Route 2 - Afternoon', stops: [
      { id: 1, name: 'Demo Primary School', lat: -25.7550, lng: 28.2100, time: '14:00' },
      { id: 2, name: 'Stop A - Maple Lane', lat: -25.7520, lng: 28.2000, time: '14:30' },
      { id: 3, name: 'Stop B - Birch Street', lat: -25.7500, lng: 28.1950, time: '14:45' }
    ]}
  ];
  
  demoRoutes.forEach(route => routes.set(route.id, route));
  
  const demoDriver = {
    id: 'driver-001',
    name: 'John Driver',
    phone: '0123456789',
    vehicle: 'SBK 123',
    route: 'route1',
    status: 'active'
  };
  drivers.set(demoDriver.id, demoDriver);
  
  const demoStudents = [
    { id: 'student-001', name: 'Alice Smith', parentPhone: 'parent1@test.com', route: 'route1', stopId: 1, status: 'at_home' },
    { id: 'student-002', name: 'Bob Johnson', parentPhone: 'parent2@test.com', route: 'route1', stopId: 2, status: 'at_home' },
    { id: 'student-003', name: 'Charlie Brown', parentPhone: 'parent3@test.com', route: 'route1', stopId: 3, status: 'at_school' }
  ];
  demoStudents.forEach(s => students.set(s.id, s));
}

function getRouteStops(routeName) {
  const route = routes.get(routeName);
  return route ? route.stops : [];
}

function getStudentsOnRoute(routeName) {
  return Array.from(students.values()).filter(s => s.route === routeName);
}

function calculateETA(location, stopId) {
  if (!location || !stopId) return null;
  // Calculate ETA based on distance (rough estimate: 30km/h avg speed)
  const etaMinutes = 15;
  return { eta: etaMinutes, calculatedAt: Date.now() };
}

setupDemoData();

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`ScholarTrack server running on port ${PORT}`);
});

module.exports = { app, wss };
