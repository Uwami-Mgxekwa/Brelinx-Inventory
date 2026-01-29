# Brelinx Inventory Mobile App - GitHub Pages Deployment

## 📱 Mobile Web Application

This is a responsive mobile web application for inventory management that can be hosted on GitHub Pages and accessed from any mobile device.

## 🚀 Features

### ✅ **Responsive Design**
- **Mobile-first approach** with touch-friendly interfaces
- **Works on all screen sizes** - phones, tablets, and desktops
- **Bottom navigation** for easy thumb navigation on mobile
- **Hamburger menu** for larger screens
- **Touch-optimized buttons** (44px minimum touch targets)

### ✅ **Core Inventory Features**
- **Dashboard** with key metrics and quick actions
- **Inventory management** with search and filtering
- **Categories** management and organization
- **Low stock alerts** and quick restocking
- **Reports** with data visualization
- **Settings** for configuration and data management

### ✅ **Progressive Web App (PWA)**
- **Installable** on mobile devices (Add to Home Screen)
- **Offline functionality** with service worker caching
- **App-like experience** with standalone display mode
- **Background sync** when connection is restored

### ✅ **Data Management**
- **Local storage** for offline data persistence
- **API integration** ready for backend connectivity
- **Data export** functionality (JSON/CSV)
- **Sync capabilities** for online/offline synchronization

## 📁 File Structure

```
src/renderer/pages/
├── mobile-app.html          # Main mobile app interface
├── manifest.json           # PWA manifest file
└── sw.js                   # Service worker for offline functionality

src/renderer/js/
└── mobile-app.js           # Mobile app JavaScript logic

src/renderer/css/
└── styles.css              # Shared styles (already exists)
```

## 🌐 GitHub Pages Deployment

### Step 1: Repository Setup
1. Create a new repository or use existing one
2. Enable GitHub Pages in repository settings
3. Choose source: `Deploy from a branch`
4. Select branch: `main` or `gh-pages`
5. Folder: `/ (root)` or `/docs`

### Step 2: File Organization for GitHub Pages
```
your-repo/
├── index.html              # Landing page (redirect to mobile-app.html)
├── mobile-app.html         # Main mobile app
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── js/
│   └── mobile-app.js       # App logic
├── css/
│   └── styles.css          # Styles
└── assets/
    └── logo.png            # App icon
```

### Step 3: Create Landing Page (index.html)
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Brelinx Inventory Mobile</title>
    <meta http-equiv="refresh" content="0; url=mobile-app.html">
</head>
<body>
    <p>Redirecting to <a href="mobile-app.html">Brelinx Inventory Mobile App</a>...</p>
</body>
</html>
```

### Step 4: Update File Paths
Update the paths in `mobile-app.html`:
```html
<!-- Change from: -->
<script src="../js/mobile-app.js"></script>
<link rel="manifest" href="manifest.json">

<!-- To: -->
<script src="js/mobile-app.js"></script>
<link rel="manifest" href="manifest.json">
```

### Step 5: Configure API Endpoint
In `mobile-app.js`, update the API endpoint:
```javascript
getApiEndpoint() {
    const stored = localStorage.getItem('mobileApiEndpoint');
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('api') || stored || 'https://your-actual-api.com/api';
}
```

## 📱 Mobile Usage

### Installation (PWA)
1. Open the app in mobile browser
2. Look for "Add to Home Screen" prompt
3. Or use browser menu → "Add to Home Screen"
4. App will install like a native app

### Offline Usage
- App works offline after first visit
- Data is stored locally in browser
- Syncs when connection is restored
- All core features available offline

### API Integration
- Configure API endpoint in Settings
- App will sync data with your backend
- Supports both online and offline modes
- Local data persists between sessions

## 🔧 Customization

### Branding
- Update colors in CSS variables (`:root` section)
- Replace logo in `assets/logo.png`
- Modify app name in `manifest.json`

### Features
- Add/remove navigation items in HTML
- Extend functionality in `mobile-app.js`
- Customize data fields for your inventory needs

### API Integration
- Implement actual API calls in `loadFromAPI()` method
- Add authentication if needed
- Configure sync intervals and retry logic

## 🌍 Access URLs

Once deployed on GitHub Pages:
- **Main URL**: `https://yourusername.github.io/repository-name/`
- **Direct Mobile App**: `https://yourusername.github.io/repository-name/mobile-app.html`
- **With API Parameter**: `https://yourusername.github.io/repository-name/mobile-app.html?api=https://your-api.com`

## 📊 Analytics & Monitoring

Consider adding:
- Google Analytics for usage tracking
- Error monitoring (Sentry, LogRocket)
- Performance monitoring
- User feedback collection

## 🔒 Security Considerations

- Use HTTPS for all API communications
- Implement proper authentication
- Validate all user inputs
- Consider data encryption for sensitive information
- Regular security updates

## 🚀 Performance Optimization

- Minimize JavaScript bundle size
- Optimize images and assets
- Use service worker for aggressive caching
- Implement lazy loading for large datasets
- Consider using a CDN for static assets

## 📞 Support & Maintenance

- Monitor user feedback and issues
- Regular updates for new features
- Keep dependencies updated
- Test on various devices and browsers
- Maintain offline functionality

---

**Ready for Production**: This mobile app is fully functional and ready to be deployed to GitHub Pages for public access. Users can access it from any mobile device and install it as a PWA for an app-like experience.