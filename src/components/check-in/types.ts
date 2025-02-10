
export interface ActiveSession {
  id: string;
  class: {
    capacity: number;
  };
}

export interface CheckInSessionResponse {
  id: string;
  is_session_valid: boolean;
  class: {
    capacity: number;
  };
}
