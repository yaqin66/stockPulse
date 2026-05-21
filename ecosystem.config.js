module.exports = {
  apps: [
    {
      name: "stockpulse-puppeteer",
      script: "./backend/server.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    },
    {
      name: "stockpulse-yfinance",
      script: "./backend/server-yfinance.js",
      watch: false,
      env: {
        NODE_ENV: "production",
      }
    }
  ]
}
