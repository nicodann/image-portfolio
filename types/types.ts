export interface Artwork {
  id: string;
  title: string;
  year: number;
  description: string;
  imageUrl: string;
}

export interface SiteInfo {
  title: string;
}

export type NetlifyUser = NonNullable<
  ReturnType<Window["netlifyIdentity"]["currentUser"]>
>;
