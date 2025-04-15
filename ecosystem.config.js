module.exports = {
  apps: [
    {
      name: "gintonic-backend", // Name of the application
      script: "./index.js", // Entry point of your application
      instances: "max", // Use all available CPU cores
      exec_mode: "cluster", // Enable cluster mode
      watch: true, // Restart on file changes
      autorestart: true, // Automatically restart on crash
      max_memory_restart: "500M", // Restart if memory usage exceeds 500MB
      env: {
        NODE_ENV: "development", // Development environment variables
        PORT: 3000, // Development port
      },
      env_production: {
        NODE_ENV: "production", // Production environment variables
        PORT: 8080, // Production port
      },
      error_file: "./logs/error.log", // Error log file
      out_file: "./logs/output.log", // Output log file
      log_date_format: "YYYY-MM-DD HH:mm:ss", // Log date format
    },
  ],
};
