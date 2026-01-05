import axios from "axios";

export async function geocode(address: string) {

  if (!address || address.trim().length < 3) {
    throw new Error('Address query must be at least 3 characters');
  }
  
  const res = await axios.get("https://api.opencagedata.com/geocode/v1/json", {
    params: {
      q: address,
      key: process.env.OPENCAGE_API_KEY,
      language: "id",
      limit: 1,
    },
  });

  const result = res.data.results[0];
  if (!result) throw new Error("Address not found");

  const c = result.components;

  return {
    latitude: result.geometry.lat,
    longitude: result.geometry.lng,
    city: c.city || c.town || c.village || "UNKNOWN",
    district:
      c.city_district || c.suburb || c.county || c.state_district || "UNKNOWN",
    province: c.state || "UNKNOWN",
    postalCode: c.postcode || "00000",
    street: c.road || address,
  };
}
