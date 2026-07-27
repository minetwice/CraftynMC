# 🔥 FearLauncher Admin Dashboard - Complete Guide

## 🎯 Admin Login Credentials

**Username:** `Twicefear`  
**Password:** `baiganmine1`

⚠️ **IMPORTANT:** Only ONE admin session is allowed at a time. When Twicefear logs in, no one else (including the same admin from another device) can login until the admin logs out.

---

## 🛡️ Security Features

### Session Lock System
- When admin (Twicefear) logs in, a session token is locked
- Any other login attempt with admin credentials will be rejected
- Session lock is released when admin logs out
- Expired sessions automatically allow new logins

### Protected Routes
- All admin endpoints require valid JWT token
- Role-based access control (admin, superadmin only)
- Cannot perform actions on the admin account itself

---

## 📊 Admin Dashboard Features

### 1. **Dashboard Statistics**
- Total Users count
- Active Users (last 7 days)
- Total Coins in circulation
- Banned Users count
- Premium Users count
- Server uptime
- Memory usage
- Recent activity feed

### 2. **User Management** 
View all users with:
- Username
- UUID (partial)
- Coin balance
- Role badge
- Ban status (Active/Banned)
- Manage button

### 3. **User Actions Modal**
Click "Manage" on any user to:

#### 💰 Gift Coins (Infinite)
- Give any amount of coins to any user
- No limits - admin has infinite coin power
- Instant balance update

#### 👑 Change Role
- User → Moderator → Admin
- Automatic permission updates based on role
- Visual role badges

#### 🚫 Ban/Unban System
- Ban with reason (optional)
- Temporary or permanent bans
- One-click unban
- Ban history tracking

#### 🔑 Reset Password
- Reset any user's password
- Minimum 6 character requirement
- Instant password update

#### 🗑️ Delete User
- Permanent user deletion
- Confirmation dialog
- Cannot delete admin account

### 4. **Search Functionality**
- Real-time user search
- Filter by username
- Instant results

---

## 🔧 Backend API Endpoints

### Authentication
- `POST /admin/login` - Admin login with session lock
- `POST /admin/logout` - Release session lock

### User Management
- `GET /admin/users` - Get all users
- `GET /admin/users/:id` - Get single user
- `POST /admin/users/:id/ban` - Ban/unban user
- `POST /admin/users/:id/role` - Change user role
- `POST /admin/users/:id/permissions` - Update permissions
- `POST /admin/users/:id/gift-coins` - Gift coins
- `POST /admin/users/:id/reset-password` - Reset password
- `DELETE /admin/users/:id` - Delete user

### Statistics
- `GET /admin/stats` - Dashboard statistics
- `GET /admin/activity` - Recent activity log

---

## 🎨 UI Features

### Red & Black Gradient Theme
- Animated background with particles
- Glowing effects on hover
- Smooth transitions
- Responsive design

### Modern Components
- Card-based layout
- Modal dialogs
- Tab navigation
- Toast notifications
- Status badges

---

## 📝 Database Schema Updates

New User fields added:
```javascript
{
  role: String (user/moderator/admin/superadmin),
  permissions: {
    canUploadSkins: Boolean,
    canUploadCapes: Boolean,
    canAccessPremiumMods: Boolean,
    canAccessPremiumPlugins: Boolean,
    canGiftCoins: Boolean,
    canBanUsers: Boolean,
    canEditUsers: Boolean
  },
  isBanned: Boolean,
  bannedAt: Date,
  bannedBy: String,
  banReason: String,
  banExpiresAt: Date,
  lastLogin: Date,
  loginStreak: Number,
  lastDailyReward: Date,
  activeSessionToken: String, // For session lock
  sessionLockedAt: Date,
  updatedAt: Date
}
```

---

## 🚀 How to Use

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Open website:** http://localhost:3000

3. **Click "Admin Login"** button on login page

4. **Enter credentials:**
   - Username: `Twicefear`
   - Password: `baiganmine1`

5. **Access admin panel** from sidebar

6. **Manage users** from the Users tab

7. **Logout** to release session lock

---

## ⚡ Additional Features Added

1. ✅ Session lock for admin account
2. ✅ Infinite coin gifting
3. ✅ Role management system
4. ✅ Ban/unban with reasons
5. ✅ Password reset capability
6. ✅ User deletion
7. ✅ Real-time search
8. ✅ Activity logging
9. ✅ Server statistics
10. ✅ Permission system
11. ✅ Protected admin routes
12. ✅ Cannot modify admin account
13. ✅ Visual status indicators
14. ✅ Responsive modal dialogs
15. ✅ Auto-refresh data

---

## 🔒 Security Notes

- Admin account (Twicefear) CANNOT be:
  - Banned
  - Deleted
  - Have role changed
  - Have permissions modified
  - Have password reset by others

- Session tokens expire after 30 days
- All admin actions require authentication
- Passwords are bcrypt hashed

---

## 🎮 Perfect for Modrinth-style Launcher!

Your FearLauncher now has:
- ✨ Epic red-black gradient UI
- 🎯 Full admin dashboard
- 👥 Complete user management
- 💰 Economy system
- 🛡️ Ban system
- 🔐 Secure admin login
- 📊 Analytics & stats
- 🎁 Daily rewards
- 👕 Skin/Cape system
- 📦 Mods/Resources/Plugins sections

**Server Status:** ✅ Running on port 3000

