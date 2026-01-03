const dropZone = document.getElementById("dropZone");
const input = document.getElementById("pdfInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");
const downloadBtn = document.getElementById("downloadZip");

const pageRangeInput = document.getElementById("pageRange");
const formatSelect = document.getElementById("format");
const qualitySelect = document.getElementById("quality");

let zip = null;
let totalPagesToExport = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

/* ---------- Drag & Drop ---------- */
dropZone.onclick = () => input.click();
dropZone.ondragover = e => { e.preventDefault(); dropZone.classList.add("hover"); };
dropZone.ondragleave = () => dropZone.classList.remove("hover");
dropZone.ondrop = e => {
  e.preventDefault();
  dropZone.classList.remove("hover");
  handleFile(e.dataTransfer.files[0]);
};
input.onchange = () => handleFile(input.files[0]);

/* ---------- Page Range Parser ---------- */
function parsePages(range, total) {
  if (!range) return [...Array(total).keys()].map(i => i + 1);
  let pages = new Set();
  range.split(",").forEach(p => {
    if (p.includes("-")) {
      let [s, e] = p.split("-").map(Number);
      for (let i = s; i <= e; i++) pages.add(i);
    } else pages.add(Number(p));
  });
  return [...pages].filter(p => p >= 1 && p <= total);
}

/* ---------- MAIN ---------- */
async function handleFile(file) {
  if (!file) return;

  output.innerHTML = "";
  downloadBtn.style.display = "none";
  zip = null;
  statusText.textContent = "Processing PDF...";

  const reader = new FileReader();
  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    const pages = parsePages(pageRangeInput.value, pdf.numPages);

    totalPagesToExport = pages.length;

    // ✅ DECIDE MODE FIRST
    if (totalPagesToExport >= 3) {
      zip = new JSZip();
      downloadBtn.style.display = "inline-block";
    }

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
      const quality =
        format === "jpg"
          ? (qualitySelect.value === "low" ? 0.6 : 0.95)
          : undefined;

      canvas.toBlob(blob => {
        const filename = `page_${pageNum}.${format}`;
        const url = URL.createObjectURL(blob);

        // Preview
        const img = document.createElement("img");
        img.src = url;
        output.appendChild(img);

        // ✅ MODE 1: DIRECT DOWNLOAD (≤2 pages)
        if (!zip) {
          const a = document.createElement("a");
          a.href = url;
          a.download = filename;
          a.textContent = `Download ${filename}`;
          a.style.display = "block";
          a.style.marginBottom = "10px";
          output.appendChild(a);
        }
        // ✅ MODE 2: ZIP (≥3 pages)
        else {
          zip.file(filename, blob);
        }
      }, mime, quality);
    }

    statusText.textContent = "Conversion completed ✔";
  };

  reader.readAsArrayBuffer(file);
}

/* ---------- ZIP DOWNLOAD ---------- */
downloadBtn.onclick = async () => {
  if (!zip) return;
  statusText.textContent = "Preparing ZIP...";
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "pdf-images.zip");
  statusText.textContent = "ZIP downloaded ✔";
};
