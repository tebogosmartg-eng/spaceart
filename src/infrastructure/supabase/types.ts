export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "user" | "moderator" | "admin";
/** @deprecated Legacy values may exist in DB until migration 008 runs */
export type LegacyUserRole = "visitor" | "creative";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type ListingStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          role: UserRole;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          role?: UserRole;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string | null;
          icon: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name?: string;
          description?: string | null;
          icon?: string | null;
          sort_order?: number;
        };
        Relationships: [];
      };
      creatives: {
        Row: {
          id: string;
          profile_id: string;
          slug: string;
          display_name: string;
          bio: string | null;
          city: string | null;
          province: string | null;
          whatsapp_number: string | null;
          cover_image_url: string | null;
          avatar_url: string | null;
          status: ApprovalStatus;
          verified: boolean;
          is_featured: boolean;
          rejection_note: string | null;
          approved_at: string | null;
          approved_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          profile_id: string;
          slug: string;
          display_name: string;
          bio?: string | null;
          city?: string | null;
          province?: string | null;
          whatsapp_number?: string | null;
          cover_image_url?: string | null;
          avatar_url?: string | null;
          status?: ApprovalStatus;
          verified?: boolean;
          is_featured?: boolean;
          rejection_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
        };
        Update: {
          slug?: string;
          display_name?: string;
          bio?: string | null;
          city?: string | null;
          province?: string | null;
          whatsapp_number?: string | null;
          cover_image_url?: string | null;
          avatar_url?: string | null;
          status?: ApprovalStatus;
          verified?: boolean;
          is_featured?: boolean;
          rejection_note?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "creatives_profile_id_fkey";
            columns: ["profile_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      listings: {
        Row: {
          id: string;
          creative_id: string;
          category_id: string;
          slug: string;
          title: string;
          description: string | null;
          status: ListingStatus;
          is_trending: boolean;
          price_from_cents: number | null;
          price_label: string | null;
          rejection_note: string | null;
          published_at: string | null;
          approved_at: string | null;
          approved_by: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          creative_id: string;
          category_id: string;
          slug: string;
          title: string;
          description?: string | null;
          status?: ListingStatus;
          is_trending?: boolean;
          price_from_cents?: number | null;
          price_label?: string | null;
          rejection_note?: string | null;
          published_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
        };
        Update: {
          creative_id?: string;
          category_id?: string;
          slug?: string;
          title?: string;
          description?: string | null;
          status?: ListingStatus;
          is_trending?: boolean;
          price_from_cents?: number | null;
          price_label?: string | null;
          rejection_note?: string | null;
          published_at?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "listings_creative_id_fkey";
            columns: ["creative_id"];
            referencedRelation: "creatives";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "listings_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      listing_media: {
        Row: {
          id: string;
          listing_id: string;
          cloudinary_public_id: string | null;
          storage_path: string | null;
          url: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          listing_id: string;
          cloudinary_public_id?: string | null;
          storage_path?: string | null;
          url: string;
          sort_order?: number;
        };
        Update: {
          cloudinary_public_id?: string | null;
          storage_path?: string | null;
          url?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "listing_media_listing_id_fkey";
            columns: ["listing_id"];
            referencedRelation: "listings";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: { Args: Record<string, never>; Returns: boolean };
      is_staff: { Args: Record<string, never>; Returns: boolean };
      can_approve_content: { Args: Record<string, never>; Returns: boolean };
      admin_approve_creative: { Args: { p_creative_id: string }; Returns: undefined };
      admin_reject_creative: {
        Args: { p_creative_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      admin_approve_listing: { Args: { p_listing_id: string }; Returns: undefined };
      admin_reject_listing: {
        Args: { p_listing_id: string; p_reason?: string | null };
        Returns: undefined;
      };
      admin_set_creative_verified: {
        Args: { p_creative_id: string; p_verified: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      approval_status: ApprovalStatus;
      listing_status: ListingStatus;
    };
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];

export type Profile = Tables<"profiles">;
export type Category = Tables<"categories">;
export type Creative = Tables<"creatives">;
export type Listing = Tables<"listings">;
export type ListingMedia = Tables<"listing_media">;

export type ListingWithRelations = Listing & {
  categories?: Category | null;
  creatives?: Creative | null;
  listing_media?: ListingMedia[];
};
