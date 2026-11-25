export interface HydLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const hyderabadLocations: HydLocation[] = [
  { name: 'Kukatpally Metro Station', address: 'Kukatpally, Hyderabad', lat: 17.4948, lng: 78.3996 },
  { name: 'Miyapur Metro Station', address: 'Miyapur, Hyderabad', lat: 17.4967, lng: 78.3528 },
  { name: 'HITEC City (Cyber Towers)', address: 'HITEC City, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Gachibowli (DLF Cyber City)', address: 'Gachibowli, Hyderabad', lat: 17.4401, lng: 78.3489 },
  { name: 'Kondapur Bus Depot', address: 'Kondapur, Hyderabad', lat: 17.4699, lng: 78.3622 },
  { name: 'Financial District (Wave Rock)', address: 'Financial District, Hyderabad', lat: 17.4219, lng: 78.3399 },
  { name: 'KPHB Colony', address: 'KPHB, Hyderabad', lat: 17.4849, lng: 78.3986 },
  { name: 'Madhapur (Raheja Mindspace)', address: 'Madhapur, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Ameerpet Metro Station', address: 'Ameerpet, Hyderabad', lat: 17.4375, lng: 78.4483 },
  { name: 'Secunderabad Railway Station', address: 'Secunderabad, Hyderabad', lat: 17.4399, lng: 78.4983 },
  { name: 'Begumpet', address: 'Begumpet, Hyderabad', lat: 17.4435, lng: 78.464 },
  { name: 'Jubilee Hills Check Post', address: 'Jubilee Hills, Hyderabad', lat: 17.4239, lng: 78.4117 },
  { name: 'LB Nagar Metro Station', address: 'LB Nagar, Hyderabad', lat: 17.3457, lng: 78.5522 },
  { name: 'Charminar', address: 'Old City, Hyderabad', lat: 17.3616, lng: 78.4747 },
  { name: 'RGIA Airport (Shamshabad)', address: 'Shamshabad, Hyderabad', lat: 17.2403, lng: 78.4294 },
];

export function findLocation(name: string): HydLocation | undefined {
  return hyderabadLocations.find((location) => location.name === name);
}

export const providerLabels: Record<string, string> = {
  PRIVATE_CARPOOL: 'Private carpool',
  COMMERCIAL_SHARED_CAB: 'Shared cab',
  PUBLIC_BUS: 'Public bus',
  METRO_FEEDER: 'Metro feeder',
  COMPANY_SHUTTLE: 'Company shuttle',
  AUTO: 'Auto',
  CAB: 'Cab',
  EXTERNAL_CAB: 'External cab',
};

export const preferenceOptions = [
  { value: 'BALANCED', label: 'Best overall' },
  { value: 'CHEAPEST', label: 'Cheapest' },
  { value: 'FASTEST', label: 'Fastest' },
  { value: 'MOST_RELIABLE', label: 'Most reliable' },
];

export const sortOptions = [
  { value: '', label: 'Recommended' },
  { value: 'LOWEST_PRICE', label: 'Lowest price' },
  { value: 'FASTEST', label: 'Fastest' },
  { value: 'LOWEST_WALKING', label: 'Least walking' },
  { value: 'MOST_RELIABLE', label: 'Most reliable' },
];
