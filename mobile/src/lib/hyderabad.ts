export interface HydLocation {
  name: string;
  address: string;
  lat: number;
  lng: number;
}

export const hyderabadLocations: HydLocation[] = [
  { name: 'Kukatpally Metro', address: 'Kukatpally, Hyderabad', lat: 17.4948, lng: 78.3996 },
  { name: 'Miyapur Metro', address: 'Miyapur, Hyderabad', lat: 17.4967, lng: 78.3528 },
  { name: 'HITEC City (Cyber Towers)', address: 'HITEC City, Hyderabad', lat: 17.4483, lng: 78.3915 },
  { name: 'Gachibowli (DLF)', address: 'Gachibowli, Hyderabad', lat: 17.4425, lng: 78.3489 },
  { name: 'Secunderabad Railway Station', address: 'Secunderabad, Hyderabad', lat: 17.4399, lng: 78.5015 },
  { name: 'Ameerpet Metro', address: 'Ameerpet, Hyderabad', lat: 17.4374, lng: 78.4487 },
  { name: 'Begumpet', address: 'Begumpet, Hyderabad', lat: 17.4436, lng: 78.4645 },
  { name: 'Banjara Hills (GVK One)', address: 'Banjara Hills, Hyderabad', lat: 17.4126, lng: 78.4481 },
  { name: 'Jubilee Hills Check Post', address: 'Jubilee Hills, Hyderabad', lat: 17.4239, lng: 78.4112 },
  { name: 'Madhapur (Inorbit Mall)', address: 'Madhapur, Hyderabad', lat: 17.4363, lng: 78.3866 },
  { name: 'LB Nagar', address: 'LB Nagar, Hyderabad', lat: 17.3457, lng: 78.5522 },
  { name: 'Uppal', address: 'Uppal, Hyderabad', lat: 17.4056, lng: 78.5591 },
  { name: 'KPHB Colony', address: 'KPHB, Hyderabad', lat: 17.4849, lng: 78.3915 },
  { name: 'Charminar', address: 'Charminar, Hyderabad', lat: 17.3616, lng: 78.4747 },
  { name: 'Rajiv Gandhi International Airport', address: 'Shamshabad, Hyderabad', lat: 17.2403, lng: 78.4294 },
];

export function findLocation(address?: string | null) {
  if (!address) return undefined;
  return hyderabadLocations.find((location) => location.address === address);
}

export const preferenceOptions = [
  { value: 'BALANCED', label: 'Balanced' },
  { value: 'CHEAPEST', label: 'Cheapest' },
  { value: 'FASTEST', label: 'Fastest' },
  { value: 'MOST_RELIABLE', label: 'Most reliable' },
];

export const providerLabels: Record<string, string> = {
  PRIVATE_CARPOOL: 'Carpool',
  COMMERCIAL_SHARED_CAB: 'Shared cab',
  PUBLIC_BUS: 'Bus',
  METRO_FEEDER: 'Metro feeder',
  COMPANY_SHUTTLE: 'Company shuttle',
  AUTO: 'Auto',
  CAB: 'Cab',
  EXTERNAL_CAB: 'External cab',
};
