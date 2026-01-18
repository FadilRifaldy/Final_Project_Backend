import axios from 'axios';
import dotenv from 'dotenv';
import qs from 'qs';

dotenv.config();

const debugLog = (msg: string) => {
  console.log(`[RajaOngkir Debug] [${new Date().toISOString()}] ${msg}`);
};

debugLog(`[Env Check] RAJAONGKIR_API_KEY present: ${!!process.env.RAJAONGKIR_API_KEY}`);
debugLog(`[Env Check] RAJAONGKIR_BASE_URL: ${process.env.RAJAONGKIR_BASE_URL}`);

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY;
const RAJAONGKIR_BASE_URL = process.env.RAJAONGKIR_BASE_URL || 'https://rajaongkir.komerce.id/api/v1';

const rajaongkirApi = axios.create({
  baseURL: RAJAONGKIR_BASE_URL,
  headers: { key: RAJAONGKIR_API_KEY },
  timeout: 15000,
});

export interface LocationResult {
  id: number;
  type: string;
  label: string;
}

/**
 * Find location (City/Subdistrict) using Komerce Search API
 */
export async function findRajaOngkirLocation(query: string): Promise<LocationResult | null> {
  try {
    debugLog(`[RajaOngkir] Searching location: "${query}"`);
    console.log(`[RajaOngkir] Searching location: "${query}"`);

    const response = await rajaongkirApi.get('/destination/domestic-destination', {
      params: {
        search: query,
        limit: 1,
      },
    });

    if (response.data && response.data.data && response.data.data.length > 0) {
      const result = response.data.data[0];
      debugLog(`[RajaOngkir] Found: ${result.label} (ID: ${result.id}, Type: ${result.type})`);
      return {
        id: result.id,
        type: result.type,
        label: result.label,
      };
    }

    debugLog(`[RajaOngkir] No location found for: "${query}"`);
    return null;
  } catch (error: any) {
    const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    debugLog(`[RajaOngkir] Error searching location: ${errorMsg}`);
    console.error('[RajaOngkir] Error searching location:', errorMsg);
    return null;
  }
}

/**
 * Wrapper for backward compatibility (returns ID as string)
 * Prefer findRajaOngkirLocation for new code
 */
export async function findRajaOngkirCityId(cityName: string): Promise<string | null> {
  const location = await findRajaOngkirLocation(cityName);
  return location ? String(location.id) : null;
}

/**
 * Get Shipping Cost from RajaOngkir (Komerce V2)
 */
export async function getRajaOngkirShippingCost(
  origin: number,
  originType: string,
  destination: number,
  destinationType: string,
  weight: number,
  courier: string = 'jne,pos,tiki'
) {
  try {
    debugLog(`[RajaOngkir] Calculating cost: ${origin} (${originType}) -> ${destination} (${destinationType}), Weight: ${weight}g`);
    
    // Komerce usually handles one courier per request nicely, or multiple depending on endpoint versions.
    // We stick to the loop if needed, but let's check one by one to be safe.
    const couriers = courier.split(',').map(c => c.trim().toLowerCase()).filter(Boolean);
    const allOptions: any[] = [];

    for (const c of couriers) {
      try {
        const payload = {
          origin,
          originType,
          destination,
          destinationType,
          weight,
          courier: c,
        };

        const response = await rajaongkirApi.post('/calculate/domestic-cost', qs.stringify(payload), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (response.data && response.data.data) {
           // Komerce V2 Structure might differ slightly based on test results,
           // but our test showed: { status: true, message: "Success", data: [ { name: "JNE...", service: "REG", cost: 15000, etd: "1-2 days" } ] }
           // Let's adapt to that structure.
           const results = response.data.data;
           if (Array.isArray(results)) {
             results.forEach((svc: any) => {
               allOptions.push({
                 courier: c.toUpperCase(),
                 courierName: svc.name || c.toUpperCase(),
                 service: svc.service,
                 description: svc.description || svc.service,
                 cost: svc.cost,
                 etd: svc.etd ? svc.etd.replace(' days', ' hari').replace(' day', ' hari') : '-',
               });
             });
           }
        }
      } catch (err: any) {
         // Log error but continue to next courier
         const msg = err.response?.data?.message || err.message;
         debugLog(`[RajaOngkir] Error for ${c}: ${msg}`);
      }
    }

    debugLog(`[RajaOngkir] Total options found: ${allOptions.length}`);

    return {
      success: allOptions.length > 0,
      options: allOptions,
    };
  } catch (error: any) {
    const errMsg = error.response?.data ? JSON.stringify(error.response.data) : error.message;
    debugLog(`[RajaOngkir] Fatal error calculating cost: ${errMsg}`);
    
    return {
      success: false,
      message: error.message,
      options: [],
    };
  }
}
