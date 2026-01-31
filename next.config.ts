import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
	dest: 'public',
	disable: process.env.NODE_ENV === 'development',
	register: true,
	workboxOptions: {
		skipWaiting: true,
		runtimeCaching: [
			{
				urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
				handler: 'CacheFirst',
				options: {
					cacheName: 'google-fonts',
					expiration: {
						maxEntries: 4,
						maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
					}
				}
			},
			{
				urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
				handler: 'StaleWhileRevalidate',
				options: {
					cacheName: 'static-font-assets',
					expiration: {
						maxEntries: 4,
						maxAgeSeconds: 7 * 24 * 60 * 60 // 7 days
					}
				}
			},
			{
				urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
				handler: 'StaleWhileRevalidate',
				options: {
					cacheName: 'static-image-assets',
					expiration: {
						maxEntries: 64,
						maxAgeSeconds: 24 * 60 * 60 // 24 hours
					}
				}
			},
			{
				urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
				handler: 'StaleWhileRevalidate',
				options: {
					cacheName: 'supabase-storage',
					expiration: {
						maxEntries: 50,
						maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
					}
				}
			}
		]
	}
});

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: '**.supabase.co'
			}
		]
	},
	experimental: {
		serverActions: {
			bodySizeLimit: '2mb'
		}
	},
	turbopack: {}
};

export default withPWA(nextConfig);
