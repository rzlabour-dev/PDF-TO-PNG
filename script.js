const dropZone = document.getElementById("dropZone");
const input = document.getElementById("pdfInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");
const downloadBtn = document.getElementById("downloadZip");

const pageRangeInput = document.getElementById("pageRange");
const formatSelect = document.getElementById("format");
const qualitySelect = document.getElementById("quality");

const zip = new JSZip();
let imageCount = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* ---------- Drag & Drop ---------- */
dropZone.addEventListener("click", () => input.click());

dropZone.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("hover");
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("hover");
});

dropZone.addEventListener("drop", e => {
  e.preventDefault();
  dropZone.classList.remove("hover");
  handleFile(e.dataTransfer.files[0]);
});

input.addEventListener("change", () => handleFile(input.files[0]));

/* ---------- Page Range Parser ---------- */
function parsePages(range, total) {
  if (!range) return [...Array(total).keys()].map(i => i + 1);

  let pages = new Set();
  range.split(",").forEach(part => {
    if (part.includes("-")) {
      let [s, e] = part.split("-").map(Number);
      for (let i = s; i <= e; i++) pages.add(i);
    } else {
      pages.add(Number(part));
    }
  });
  return [...pages].filter(p => p >= 1 && p <= total);
}

/* ---------- Main Logic ---------- */
async function handleFile(file) {
  if (!file) return;

  output.innerHTML = "";
  zip.files = {};
  imageCount = 0;
  downloadBtn.disabled = true;
  statusText.textContent = "Processing PDF...";

  const reader = new FileReader();
  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    const pages = parsePages(pageRangeInput.value, pdf.numPages);

    for (const pageNum of pages) {
      const page = await pdf.getPage(pageNum);

      const scale = qualitySelect.value === "high" ? 2.5 : 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: canvas.getContext("2d"),
        viewport
      }).promise;

      const format = formatSelect.value;
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const quality = format === "jpg" && qualitySelect.value === "low" ? 0.6 : 0.92;

      canvas.toBlob(blob => {
        imageCount++;
        zip.file(`page_${pageNum}.${format}`, blob);

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        output.appendChild(img);

        downloadBtn.disabled = false;
      }, mime, quality);
    }

    statusText.textContent = "Conversion completed ✔";
  };

  reader.readAsArrayBuffer(file);
}

/* ---------- ZIP Download ---------- */
downloadBtn.addEventListener("click", async () => {
  statusText.textContent = "Preparing ZIP...";
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "pdf-images.zip");
  statusText.textContent = "ZIP downloaded ✔";
});
