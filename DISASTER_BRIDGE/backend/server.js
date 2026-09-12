const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 5000;
const DATA_FILE = path.join(__dirname, 'sos_data.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

function loadRequests() {
  try {
    if (!fs.existsSync(DATA_FILE)) return [];
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) || [];
  } catch (e) {
    console.error('Data read error:', e.message);
    return [];
  }
}

function saveRequests(requests) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(requests, null, 2), 'utf8');
}

function classifyEmergency(emergencyType) {
  const type = String(emergencyType || '').toLowerCase();
  if (['trapped','fire','severe','critical'].some(x => type.includes(x))) return { priority:'CRITICAL', aiScore:95 };
  if (['medical','injury','missing'].some(x => type.includes(x))) return { priority:'HIGH', aiScore:80 };
  if (['food','water','help'].some(x => type.includes(x))) return { priority:'MEDIUM', aiScore:60 };
  return { priority:'HIGH', aiScore:75 };
}

app.get('/api/health', (req, res) => res.json({ success:true, status:'ONLINE' }));

app.get('/api/sos', (req, res) => {
  const requests = loadRequests().sort((a,b) => b.id - a.id);
  res.json({ success:true, count:requests.length, data:requests });
});

app.post('/api/sos', (req, res) => {
  const { latitude, longitude, emergencyType } = req.body || {};
  const ai = classifyEmergency(emergencyType);
  const requests = loadRequests();
  const id = requests.length ? Math.max(...requests.map(x => Number(x.id) || 0)) + 1 : 1;
  const createdAt = new Date().toISOString();
  const messageId = `SOS-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
  const request = {
    id,
    emergency_type: emergencyType || 'Emergency SOS',
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    priority: ai.priority,
    ai_score: ai.aiScore,
    message_id: messageId,
    hop_count: 0,
    ttl: 10,
    status: 'WAITING',
    created_at: createdAt
  };
  requests.push(request);
  saveRequests(requests);
  console.log('NEW SOS SAVED:', request);
  res.status(201).json({ success:true, message:'SOS received and saved to Disaster Bridge', data:{
    id:`DB-${id}`, messageId, hopCount:0, ttl:10,
    emergencyType:request.emergency_type, latitude, longitude,
    priority:ai.priority, aiScore:ai.aiScore, status:'WAITING', createdAt
  }});
});

app.post('/api/relay', (req,res) => {
  const { messageId } = req.body || {};
  const requests = loadRequests();
  const item = requests.find(x => x.message_id === messageId);
  if (!item) return res.status(404).json({success:false,message:'SOS message not found'});
  const ttl = Number(item.ttl ?? 10);
  if (ttl <= 0) return res.status(400).json({success:false,message:'Message TTL expired'});
  item.hop_count = Number(item.hop_count ?? 0) + 1;
  item.ttl = ttl - 1;
  saveRequests(requests);
  res.json({success:true,message:'SOS successfully relayed',data:{messageId,hopCount:item.hop_count,ttl:item.ttl}});
});

app.put('/api/sos/:id/status', (req,res) => {
  const status = req.body?.status;
  if (!['WAITING','RESPONDING','RESOLVED'].includes(status)) return res.status(400).json({success:false,message:'Invalid status'});
  const requests = loadRequests();
  const item = requests.find(x => Number(x.id) === Number(req.params.id));
  if (!item) return res.status(404).json({success:false,message:'SOS request not found'});
  item.status = status;
  saveRequests(requests);
  res.json({success:true,message:'SOS status updated successfully',data:{id:item.id,status}});
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`DISASTER BRIDGE backend running on http://localhost:${PORT}`);
  console.log('Data storage: backend/sos_data.json');
});
