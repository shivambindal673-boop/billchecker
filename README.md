# HisabOne

One App. All Your Business Calculations.

Photograph or upload a shop bill, review the detected line-item amounts, and verify the addition. Amounts are added in the browser using integer paise. OCR never calculates the sum.

## Run the application

1. Install Node.js 20 or newer.
2. Open a terminal in this project folder and run:

   ```sh
   npm install
   npm run dev
   ```

3. Open <http://localhost:5173>.

No API key or paid OCR account is required. The first OCR check downloads the Tesseract engine and numeric language data from its public CDN; an internet connection is needed for that first download. Recognition then runs in your browser. The image is not sent to an OCR service. For camera access on another device, use HTTPS or a secure local tunnel; localhost is allowed by browsers.

## Check a bill

Open the camera or upload an image your browser can display. The crop area follows the photo's proportions, including long and narrow bills. Rotate, zoom, or enable clarity enhancement, then select **Check Bill Total**. Review the detected lines, correct or add amounts, enter and confirm the written total, confirm the list is complete, and select **Recalculate Total**. The calculated sum updates as amounts change. Select **Verify and save result** only after reviewing all readings.

Repeated values are highlighted for confirmation, not removed automatically. Quantity-only lines, dates, and labeled subtotals are excluded. A clearly labeled final total is kept separate from the item sum. If no written total is found, enter it manually. Saved bill history and images stay in this browser's IndexedDB; clearing site data removes them.

## OCR accuracy

The OCR whitelist accepts numeric digits only, including Devanagari digits; text recognition is not used. Number positions and narrow column alignment help separate amount columns from HSN, quantity, and weight columns. For printed GST invoices, the parser can identify an item subtotal by matching the aligned item-column sum, then include aligned tax rows when checking the final total. This remains a heuristic: handwritten digits and unusual layouts can be misread, so check the image and confirm every reading. Never treat a green match as proof that OCR found every line.

## Extra tools

Choose **Calculator** for a standard keypad, custom-rate GST calculations, and simple or compound interest. Choose **GST bill maker** to enter supplier and customer GSTIN, firm/contact details, state, PIN code, invoice information, HSN, products, quantity, rate, and a manually entered GST percentage for each item. CGST/SGST or IGST is selected from the states and every line and invoice total updates automatically. Create, download, or share its tax-invoice PDF. Choose **Image to PDF** to combine bill photos into a multi-page PDF. Supported browsers open the system share sheet, which may offer Gmail, WhatsApp, Drive, Nearby/Quick Share, or Files; desktop browsers fall back to downloading.

## Development checks

```sh
npm test
npm run build
```