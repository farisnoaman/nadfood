# Coolify Deployment Guide - Hostinger VPS

## 📋 Prerequisites

- Hostinger VPS with Ubuntu 20.04+ or Debian 11+
- Domain name pointed to your VPS IP
- Coolify instance (can be self-hosted or use Coolify Cloud)
- Your shipment tracking app repository on GitHub/GitLab

## 🚀 Step 1: Prepare Your VPS

### 1.1 Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group
sudo usermod -aG docker $USER
```

### 1.3 Install Coolify
```bash
# Install Coolify (self-hosted)
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | sudo bash

# Or use Docker Compose method
mkdir -p /opt/coolify
cd /opt/coolify
wget https://cdn.coollabs.io/coolify/docker-compose.yml
docker-compose up -d
```

### 1.4 Access Coolify
- Open your browser: `http://your-vps-ip:8000`
- Complete the initial setup
- Create your admin account

## 🔧 Step 2: Prepare Your Application

### 2.1 Create Dockerfile
Create `Dockerfile` in `shipment_tracking-0.0.1/`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built app
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2.2 Create Nginx Configuration
Create `nginx.conf` in `shipment_tracking-0.0.1/`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Handle React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### 2.3 Update .env.example
Ensure your `.env.example` contains:
```env
VITE_SUPABASE_URL=https://kjvzhzbxspgvvmktjwdi.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 2.4 Commit Changes
```bash
git add .
git commit -m "Add Docker configuration for Coolify deployment"
git push origin main
```

## 🎯 Step 3: Configure Coolify

### 3.1 Add Your Repository
1. In Coolify dashboard, click "New Resource"
2. Select "Git Repository"
3. Connect your GitHub/GitLab account
4. Select your shipment tracking repository
5. Choose the branch (main/master)

### 3.2 Configure Application Settings

#### Basic Settings:
- **Name**: Shipment Tracking App
- **Description**: React shipment tracking application
- **Type**: Static Site / SPA

#### Build Settings:
- **Build Command**: `cd shipment_tracking-0.0.1 && npm install && npm run build`
- **Publish Directory**: `shipment_tracking-0.0.1/dist`
- **Dockerfile Path**: `shipment_tracking-0.0.1/Dockerfile`

#### Environment Variables:
Add these in Coolify:
```
VITE_SUPABASE_URL=https://kjvzhzbxspgvvmktjwdi.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### 3.3 Configure Domain
1. Go to "Domains" tab
2. Add your domain (e.g., `yourapp.yourdomain.com`)
3. Coolify will provide DNS records
4. Update your domain's DNS settings

### 3.4 Configure SSL
1. Enable "Automatic SSL Certificate"
2. Coolify will handle Let's Encrypt certificates

## 🚀 Step 4: Deploy

### 4.1 Initial Deployment
1. Click "Deploy" in Coolify
2. Monitor the build logs
3. Wait for deployment to complete

### 4.2 Verify Deployment
- Check your domain in browser
- Test all application features
- Verify environment variables are working

## 🔧 Step 5: Deploy Supabase Edge Functions

### 5.1 Install Supabase CLI
```bash
# On your local machine
curl -sSfL https://supabase.com/install.sh | sh
```

### 5.2 Deploy Edge Functions
```bash
cd /path/to/your/project/supabase/functions
supabase functions deploy --project-ref kjvzhzbxspgvvmktjwdi
```

## 📊 Step 6: Monitoring & Maintenance

### 6.1 Set up Monitoring in Coolify
- Enable resource monitoring
- Set up alerts for high CPU/memory usage
- Configure log retention

### 6.2 Backup Strategy
- Enable automatic backups in Coolify
- Backup your Supabase database regularly
- Keep your Git repository updated

### 6.3 Updates
```bash
# To update your app
git pull origin main
# Coolify will auto-deploy on push if configured

# To update Coolify itself
cd /opt/coolify
docker-compose pull
docker-compose up -d
```

## 🛠️ Troubleshooting

### Common Issues:

#### Build Fails
```bash
# Check build logs in Coolify
# Verify package.json scripts are correct
# Ensure all dependencies are in package.json
```

#### Environment Variables Not Working
```bash
# Verify variables are set in Coolify dashboard
# Check that they start with VITE_ for Vite
# Restart the application after adding variables
```

#### Domain Not Resolving
```bash
# Check DNS propagation
dig yourapp.yourdomain.com
# Verify Coolify is running on port 80/443
sudo netstat -tlnp | grep :80
```

#### Supabase Connection Issues
```bash
# Verify Supabase URL and keys
# Check Supabase project status
# Test Edge Functions manually
```

## 📱 Mobile App Deployment (Optional)

For Android APK deployment:

### 1. Build APK Locally
```bash
cd shipment_tracking-0.0.1
npm run android:build-release
```

### 2. Host APK File
```bash
# Upload APK to your VPS
scp android/app/build/outputs/apk/release/app-release.apk user@your-vps:/var/www/html/
```

### 3. Create Download Page
Add a simple download page at `/download`:
```html
<!DOCTYPE html>
<html>
<head>
    <title>Download App</title>
</head>
<body>
    <h1>Download Shipment Tracking App</h1>
    <a href="/app-release.apk" download>Download Android APK</a>
</body>
</html>
```

## 🔒 Security Best Practices

### 1. Firewall Configuration
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Regular Updates
```bash
# Set up automatic security updates
sudo apt install unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades
```

### 3. SSL Configuration
- Use Coolify's automatic SSL
- Redirect HTTP to HTTPS
- Set security headers

## 📈 Performance Optimization

### 1. Enable Gzip Compression
Add to your `nginx.conf`:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Configure Caching
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. CDN Integration
- Consider using Cloudflare in front of your VPS
- Enable CDN caching for static assets

## 🎉 Post-Deployment Checklist

- [ ] Application loads correctly on your domain
- [ ] All features are working (login, shipments, etc.)
- [ ] Environment variables are properly configured
- [ ] SSL certificate is active
- [ ] Mobile app can be downloaded (if applicable)
- [ ] Supabase Edge Functions are deployed
- [ ] Monitoring and alerts are configured
- [ ] Backup strategy is in place
- [ ] Security measures are implemented

## 📞 Support

If you encounter issues:

1. Check Coolify logs in the dashboard
2. Verify your VPS resources (CPU, RAM, disk space)
3. Test your Supabase connection
4. Review this guide for troubleshooting steps
5. Check Coolify documentation: https://coolify.io/docs

---

**Deployment Date**: [Current Date]
**Version**: 0.0.1
**Platform**: Hostinger VPS + Coolify