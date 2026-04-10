/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: '*.supabase.in' },
      { protocol: 'http',  hostname: 'localhost' },
    ],
  },
  // Vercel deployment optimizations
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig
