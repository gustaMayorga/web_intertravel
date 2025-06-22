import { MetadataRoute } from 'next'

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:3002/api' 
  : '/api';

async function getPackages() {
  try {
    const response = await fetch(`${API_BASE}/packages/featured?limit=100`, {
      cache: 'no-store'
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.packages || [];
    }
  } catch (error) {
    console.error('Error fetching packages for sitemap:', error);
  }
  
  return [];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://intertravel.com.ar';
  const packages = await getPackages();
  
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/paquetes`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/opiniones`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/nosotros`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/mis-15`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/agencias`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  ];
  
  // Dynamic package pages
  const packagePages = packages.map((pkg: any) => ({
    url: `${baseUrl}/paquetes/${pkg.id}`,
    lastModified: new Date(pkg.updated_at || pkg.created_at || new Date()),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));
  
  // Destination pages (dynamic based on packages)
  const destinations = [...new Set(packages.map((pkg: any) => pkg.destination))];
  const destinationPages = destinations.map((destination: string) => ({
    url: `${baseUrl}/paquetes?destination=${encodeURIComponent(destination)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  // Country pages
  const countries = [...new Set(packages.map((pkg: any) => pkg.country))];
  const countryPages = countries.map((country: string) => ({
    url: `${baseUrl}/paquetes?country=${encodeURIComponent(country)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));
  
  return [
    ...staticPages,
    ...packagePages,
    ...destinationPages,
    ...countryPages
  ];
}
