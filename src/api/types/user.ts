export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface ProfilePicture {
  mimeType: string;
  encoding: string;
  data: string;
}
