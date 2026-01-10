
// src/data/homeData.js
import crud from '../services/crudInstance.js';
import API from "../services/api.js";

export async function getMinistries() {
  try {
    // استخدم get لأن الراوت مفترض GET
    const res = await crud.get(API.MINISTRY.GET_MINISTRIES);
    console.log('[homeData] getMinistries res:', res);
    if (!res || res.success === false) {
      const msg = res?.data?.message || res?.error?.message || 'Failed to fetch ministries';
      throw new Error(msg);
    }

    // حسب شكل الرد عندك: إما res.data.data أو res.data
    // هنا نفترض أن الباك يرجع { status, message, data: [...] }
    const payload = res.data;
    const ministries = payload?.data || payload || [];
    return ministries;
  } catch (err) {
    console.error('[homeData] error', err);
    throw err;
  }
}
