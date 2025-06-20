export interface CityRaw {
  name?: string;
  label?: string;
  namecase?: {
    nominative?: string;
    prepositional?: string;
    // остальные падежи, если нужны
  };
  coords?: {
    lat?: number;
    lon?: number;
  };
  // другие поля опущены
}
