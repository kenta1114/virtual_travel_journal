export interface User {
  email: string;
}

export interface Entry {
  id: number;
  title: string;
  date: string;
  location: string;
  notes: string;
  image: string | null;
}

export interface Place {
  place_id: string;
  description: string;
}