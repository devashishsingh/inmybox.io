/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    serverComponentsExternalPackages: ['jspdf', 'imapflow', '7zip-bin', 'node-7z'],
  },
};

module.exports = nextConfig;
