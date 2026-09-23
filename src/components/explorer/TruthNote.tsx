/**
 * TruthNote — the mandatory "we don't measure, the community does" callout.
 *
 * SPEC §1.4: every UI surface that displays a metric must include this
 * disclaimer so that the optional OSM-derived data is never read as
 * staff-verified.
 */
export function TruthNote() {
  return (
    <aside className="cw-truth" aria-label="資料透明度" data-testid="truth-note">
      <strong>資料狀態</strong>
      <p>
        已收錄的店來自 OpenStreetMap 公開資料；Wi-Fi / 安靜 / 插座 / 友善度等條件
        沒有自動偵測的結果，未驗證時一律顯示「— 未驗證」。
        預設價值不會偽裝成實測數字；要在這張地圖上累積可信資料，必須由人在現場上傳。
      </p>
      <ul>
        <li>如果你是創辦人，請從 <code>?founder=1</code> 進入驗證流程（不對外開放）。</li>
        <li>如果你是使用者，看到不對的資料請透過 <code>mailto:hi@cafework.tw</code> 回報；我們不會把你的瀏覽紀錄上傳。</li>
      </ul>
    </aside>
  );
}
