// simple auth helper — ضبط حسب مكان تخزين التوكن عندك
export function isAuthenticated() {
  // إذا خزنت access token في localStorage:
  return !!localStorage.getItem('access_token');
  // لو تريد فحص تاريخ الانتهاء، حلل التوكن أو خزّن expiry واملأ الشيك هنا
}
