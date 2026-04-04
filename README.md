# SANS Plan Examiner - Quick Start

## For Bra Joe

### 1. Get MiniMax API Key
1. Go to https://platform.minimax.chat
2. Sign up (free account)
3. Create API key: Settings → API Keys
4. Add to `.env`:
   ```
   MINIMAX_API_KEY=your-key-here
   ```

### 2. Run the App
```bash
cd ~/sans-plan-examiner
npm start
```

### 3. Access
- **Admin:** http://localhost:3000/admin/admin.html
  - Key: `joe-examiner-secret-2024`
- **Apply:** http://localhost:3000/client/apply.html
- **Track:** http://localhost:3000/client/track.html

### 4. Test Flow
1. Open applicant portal (apply.html)
2. Fill form: ERF, address, owner details
3. Upload PDF building plan
4. Submit → goes to admin queue
5. Admin login → review → analyze → decision

### Test Applications (existing)
- TC406132, TC779937, TC775442, TC97883232

### Demo Videos
- See: `/admin/admin.html` → Login → Click app → Analyze

---

## Files
- `src/server.js` - Main API
- `src/plan-checker.js` - 16 SANS compliance rules
- `client/*.html` - Applicant portal
- `admin/admin.html` - Admin dashboard

## Issues?
- `500` on analyze → Need MiniMax key OR upload real PDF
- Login fails → Use key: `joe-examiner-secret-2024`

---

Built by kg-swarm 🤖