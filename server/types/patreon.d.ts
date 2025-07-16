interface PatreonResponse<T> {
  data: T[];
  links?: { [key: string]: string };
  meta?: { [key: string]: any };
  included?: any[];
}

interface PatreonCampaign {
  id: string;
  type: string;
  attributes: {
    created_at: string;
    creation_name: string;
    patron_count: number;
    url: string;
  };
}