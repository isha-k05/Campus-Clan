# Campus Clan 🎓

A modern React application with email OTP authentication for college social media platform.

## Features ✨

- 🏫 College selection with search functionality
- 📧 Email OTP authentication using EmailJS
- 🔐 Secure registration and login flow
- 🎨 Modern UI with glassmorphism effects
- 📱 Fully responsive design
- ⚡ Fast and smooth animations
- 🛡️ Protected routes for authenticated users

## Tech Stack 🛠️

- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **EmailJS** - Email service for OTP delivery
- **CSS3** - Modern styling with animations

## Setup Instructions 🚀

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure EmailJS

1. Sign up for a free account at [EmailJS.com](https://www.emailjs.com/)
2. Create an email service (Gmail, Outlook, etc.)
3. Create an email template with these variables:
   - `{{to_email}}` - Recipient email
   - `{{to_name}}` - Recipient name
   - `{{otp_code}}` - The OTP code

Example email template:
```
Hello {{to_name}},

Your OTP code is: {{otp_code}}

This code will expire in 10 minutes.

Thanks,
Campus Connect Team
```

4. Get your credentials:
   - Service ID
   - Template ID
   - Public Key

5. Update `src/config/emailConfig.js` with your credentials:

```javascript
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'your_service_id',
  TEMPLATE_ID: 'your_template_id',
  PUBLIC_KEY: 'your_public_key',
};
```

### 3. Run the Application

```bash
npm run dev
```

The app will open at `http://localhost:5173`

## Usage Flow 📱

1. **Select College** - Choose your college from the list
2. **Register/Login** - Create a new account or login
3. **OTP Verification** - Enter the 6-digit OTP sent to your email
4. **Dashboard** - Access your personalized dashboard

## Project Structure 📁

```
src/
├── components/
│   ├── CollegeSelection.jsx    # College selection page
│   ├── Login.jsx                # Login form
│   ├── Register.jsx             # Registration form
│   ├── OTPVerification.jsx      # OTP input
│   ├── Dashboard.jsx            # User dashboard
│   ├── ProtectedRoute.jsx       # Route guard
│   ├── Auth.css                 # Auth pages styling
│   ├── CollegeSelection.css     # College page styling
│   └── Dashboard.css            # Dashboard styling
├── context/
│   └── AuthContext.jsx          # Authentication state
├── config/
│   └── emailConfig.js           # EmailJS configuration
├── App.jsx                      # Main app component
├── App.css                      # Global styles
└── main.jsx                     # Entry point
```

## Features Breakdown 🎯

### Authentication System
- Email-based OTP verification
- Secure user registration
- Login with existing account
- Protected routes
- Session persistence with localStorage

### UI/UX
- Glassmorphism design
- Smooth animations and transitions
- Dynamic backgrounds (day/evening/night)
- Responsive grid layouts
- Interactive hover effects
- Custom scrollbar

## Build for Production 🏗️

```bash
npm run build
```

The optimized files will be in the `dist/` folder.

## Notes 📝

- OTP codes are 6 digits
- User data is stored in localStorage
- Make sure to configure EmailJS before testing
- Check spam folder if OTP email doesn't arrive

## Support 💬

For issues with EmailJS setup, visit [EmailJS Documentation](https://www.emailjs.com/docs/)

---

Built with ❤️ using React + Vite
