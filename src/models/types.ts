export type Coordinates = {
  latitude: number;
  longitude: number;
};

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  handle?: string;
  currentLocation?: Coordinates;
  friendIds: string[];
  ticketIds: string[];
};

export type Venue = {
  id: string;
  name: string;
  address: string;
  city: string;
  coordinates: Coordinates | null;
  hours?: { open: string; close: string }[];
  contact?: { phone?: string; email?: string; website?: string };
  links?: { mapUrl?: string; ticketUrl?: string };
  popular?: boolean;
};

export type Event = {
  id: string;
  title: string;
  venueId: string;
  startTime: string;
  endTime: string;
  description?: string;
  category?: string;
  capacity?: number;
  ticketType?: string;
  artists?: string[];
  price?: number;
  priceNote?: string;
  hasTicket?: boolean;
  raUrl?: string;
  organizer?: string;
  seriesId?: string;
  seriesName?: string;
};

export type Ticket = {
  id: string;
  eventId: string;
  userId: string;
  status: 'locked' | 'available' | 'cancelled' | 'used';
  price?: number;
  source?: string;
  expiresAt?: string;
};

export type Friendship = {
  userId: string;
  friendId: string;
  status: 'pending' | 'accepted' | 'blocked';
  mutual: boolean;
  lastSeenAt?: string;
};

export type CustomLocation = {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
};

export type LocationShare = {
  userId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  accuracy?: number;
  visibility: 'public' | 'friends' | 'private';
};
