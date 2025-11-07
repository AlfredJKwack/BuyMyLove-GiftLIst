/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost'],
  },
  // Configure public folder for static assets
  publicRuntimeConfig: {
    staticFolder: '/public',
  },
}

export default nextConfig
