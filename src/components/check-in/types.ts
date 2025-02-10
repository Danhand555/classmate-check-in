
export interface ActiveSession {
  id: string;
  class: {
    capacity: number;
  };
}

export interface CheckInSessionResponse {
  id: string;
  is_active: boolean;
  expires_at: string;
  class: {
    capacity: number;
  };
}
