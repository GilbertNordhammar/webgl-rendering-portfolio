const withProgressBar = require('next-progressbar')

module.exports = withProgressBar({
  distDir: process.env.NODE_ENV === "production" ? "build-prod" : "build-dev",
  webpack: (config, { isServer }) => {
    config.resolve = {
      ...config.resolve,
      extensions: [".js", ".json", ".ts", ".tsx"]
    }

    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false
      };
    }

    return config
  }
})
