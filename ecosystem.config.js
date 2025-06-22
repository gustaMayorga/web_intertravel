module.exports = {
  apps: [
    {
      name: 'intertravel-backend',
      script: './backend/server.js',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max_old_space_size=1024'
    },
    {
      name: 'intertravel-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 3005
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '1G'
    }
  ],

  deploy: {
    production: {
      user: 'www-data',
      host: ['tu-servidor.com'],
      ref: 'origin/main',
      repo: 'git@github.com:tu-usuario/intertravel-website.git',
      path: '/var/www/intertravel',
      'post-deploy': 'cd backend && npm ci --only=production && cd ../frontend && npm ci && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': 'apt-get update && apt-get install -y git'
    }
  }
};
