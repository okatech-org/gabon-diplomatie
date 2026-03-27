/**
 * Google Places API integration for address autocomplete
 * Uses the same API key as Gemini (GEMINI_API_KEY with Places API enabled)
 */
import { v } from "convex/values";
import { action } from "../_generated/server";

// Places API autocomplete endpoint
const PLACES_AUTOCOMPLETE_URL =
  "https://maps.googleapis.com/maps/api/place/autocomplete/json";
const PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

export type PlaceAutocompleteResult = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

export type PlaceDetails = {
  street: string;
  city: string;
  postalCode: string;
  country: string;
  countryCode: string;
  formattedAddress: string;
  lat?: number;
  lng?: number;
};

/**
 * Search for address suggestions using Google Places Autocomplete
 */
export const autocomplete = action({
  args: {
    input: v.string(),
    types: v.optional(v.string()), // e.g., "address", "geocode", "(cities)"
    language: v.optional(v.string()),
    components: v.optional(v.string()), // e.g., "country:fr|country:ga"
  },
  handler: async (
    _,
    { input, types, language, components },
  ): Promise<{
    success: boolean;
    predictions: PlaceAutocompleteResult[];
    error?: string;
  }> => {
    if (!input || input.length < 3) {
      return { success: true, predictions: [] };
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        predictions: [],
        error: "API key not configured",
      };
    }

    try {
      const params = new URLSearchParams({
        input,
        key: apiKey,
        types: types || "address",
        language: language || "fr",
      });

      if (components) {
        params.append("components", components);
      }

      const response = await fetch(`${PLACES_AUTOCOMPLETE_URL}?${params}`);
      const data = await response.json();

      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        console.error("Places API error:", data.status, data.error_message);
        return {
          success: false,
          predictions: [],
          error: data.error_message || data.status,
        };
      }

      const predictions: PlaceAutocompleteResult[] = (
        data.predictions || []
      ).map(
        (p: {
          place_id: string;
          description: string;
          structured_formatting?: {
            main_text?: string;
            secondary_text?: string;
          };
        }) => ({
          placeId: p.place_id,
          description: p.description,
          mainText: p.structured_formatting?.main_text || p.description,
          secondaryText: p.structured_formatting?.secondary_text || "",
        }),
      );

      return { success: true, predictions };
    } catch (error) {
      console.error("Places autocomplete error:", error);
      return {
        success: false,
        predictions: [],
        error: (error as Error).message,
      };
    }
  },
});

/**
 * Get detailed address components from a place ID
 */
export const getDetails = action({
  args: {
    placeId: v.string(),
    language: v.optional(v.string()),
  },
  handler: async (
    _,
    { placeId, language },
  ): Promise<{
    success: boolean;
    details?: PlaceDetails;
    error?: string;
  }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { success: false, error: "API key not configured" };
    }

    try {
      const params = new URLSearchParams({
        place_id: placeId,
        key: apiKey,
        fields: "address_components,formatted_address,geometry,name,place_id",
        language: language || "fr",
      });

      const response = await fetch(`${PLACES_DETAILS_URL}?${params}`);
      const data = await response.json();

      if (data.status !== "OK") {
        return {
          success: false,
          error: data.error_message || data.status,
        };
      }

      const result = data.result;
      const components = result.address_components || [];

      // Extract address components
      const getComponent = (types: string[]): string => {
        const component = components.find((c: { types: string[] }) =>
          types.some((t) => c.types.includes(t)),
        );
        return component?.long_name || "";
      };

      const getShortComponent = (types: string[]): string => {
        const component = components.find((c: { types: string[] }) =>
          types.some((t) => c.types.includes(t)),
        );
        return component?.short_name || "";
      };

      const streetNumber = getComponent(["street_number"]);
      const route = getComponent(["route"]);
      const street = streetNumber ? `${streetNumber} ${route}` : route;

      const details: PlaceDetails = {
        street,
        city:
          getComponent(["locality"]) ||
          getComponent(["administrative_area_level_2"]),
        postalCode: getComponent(["postal_code"]),
        country: getComponent(["country"]),
        countryCode: getShortComponent(["country"]),
        formattedAddress: result.formatted_address || "",
        lat: result.geometry?.location?.lat,
        lng: result.geometry?.location?.lng,
      };

      return { success: true, details };
    } catch (error) {
      console.error("Places details error:", error);
      return { success: false, error: (error as Error).message };
    }
  },
});
