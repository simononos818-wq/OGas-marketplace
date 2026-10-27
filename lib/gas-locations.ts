export type GasLocation = {
  slug: string;
  name: string;
  region: string;
  searchTerms: string[];
  introduction: string;
};

export const GAS_LOCATIONS: GasLocation[] = [
  {
    slug: 'ughelli',
    name: 'Ughelli',
    region: 'Delta State',
    searchTerms: ['ughelli', 'oteri', 'isodje'],
    introduction: 'Find verified cooking gas sellers serving Ughelli and nearby communities. Compare current LPG prices per kilogram, choose pickup or delivery where available, and keep a weighed receipt for your refill.',
  },
  {
    slug: 'warri',
    name: 'Warri',
    region: 'Delta State',
    searchTerms: ['warri', 'effurun'],
    introduction: 'Compare verified LPG sellers serving Warri and nearby areas. OGas shows current cooking gas prices per kilogram and gives you a clear digital order record with a weighed receipt.',
  },
];

export function getGasLocation(slug: string): GasLocation | undefined {
  return GAS_LOCATIONS.find((location) => location.slug === slug.toLowerCase());
}

export function sellersForLocation<T extends { area: string; city?: string; state?: string }>(sellers: T[], location: GasLocation): T[] {
  const terms = [...new Set([...location.searchTerms, location.name])].map((term) => term.toLowerCase());
  return sellers.filter((seller) => {
    const haystack = [seller.area, seller.city, seller.state].filter(Boolean).join(' ').toLowerCase();
    return terms.some((term) => haystack.includes(term));
  });
}
