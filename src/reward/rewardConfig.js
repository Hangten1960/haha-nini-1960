// ============================================================================================
//  FINAL REWARD – CONFIGURATION
//
//  Paste the official coupon claim link between the quotes, then run `npm run build`:
//      export const COUPON_CLAIM_URL = "https://www.example.com/your-official-coupon-page";
//
//  While it is "待補" (or anything that is not an https:// link) the reward screen still shows,
//  but the claim button stays disabled and says the coupon is awaiting activation.
//  The game never invents a link and never claims a coupon was issued: it only opens this page.
// ============================================================================================
export const COUPON_CLAIM_URL = "https://bmai.app/07e21eae";

export const REWARD_COPY = {
  title: 'CONGRATULATIONS!',
  subtitle: 'WINTER ADVENTURE COMPLETE',
  zhTitle: '恭喜你成功闖關！',
  zhBody: '感謝你幫助哈哈熊與妮妮熊找回冬日魔法星星，讓整座寒帶島嶼重新閃耀！',
  rewardLabel: 'Your Reward:',
  rewardAmount: 'HANG TEN NT$300',
  rewardName: '購物抵用券',
  buttonZh: '立即領取優惠券',
  buttonEn: 'CLAIM YOUR REWARD',
  pendingZh: '優惠券領取連結即將開放',
  pendingEn: 'Awaiting activation',
};

/** True only for a real https link (so the placeholder "待補" can never be opened as a URL). */
export function couponReady(url = COUPON_CLAIM_URL) {
  if (typeof url !== 'string') return false;
  try { const u = new URL(url.trim()); return u.protocol === 'https:' && !!u.hostname; } catch { return false; }
}
