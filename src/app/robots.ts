import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/' }, sitemap: 'https://digital-nomad-cafe-map.vercel.app/sitemap.xml' };
}
