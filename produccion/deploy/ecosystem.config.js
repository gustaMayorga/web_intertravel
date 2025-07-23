module.exports = {
  apps: [
    {
      name: 'intertravel-backend',
      script: './server.js',
      cwd: '/var/www/intertravel/backend',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002
      },
      error_file: '/var/www/intertravel/logs/backend-error.log',
      out_file: '/var/www/intertravel/logs/backend-out.log',
      log_file: '/var/www/intertravel/logs/backend-combined.log',
      time: true
    },
    {
      name: 'intertravel-admin',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/intertravel/admin-panel',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3005
      },
      error_file: '/var/www/intertravel/logs/admin-error.log',
      out_file: '/var/www/intertravel/logs/admin-out.log',
      log_file: '/var/www/intertravel/logs/admin-combined.log',
      time: true
    },
    {
      name: 'intertravel-client',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/intertravel/client-app',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3009
      },
      error_file: '/var/www/intertravel/logs/client-error.log',
      out_file: '/var/www/intertravel/logs/client-out.log',
      log_file: '/var/www/intertravel/logs/client-combined.log',
      time: true
    }
  ]
};