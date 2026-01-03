const dropZone = document.getElementById("dropZone");
const input = document.getElementById("pdfInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");
const downloadBtn = document.getElementById("downloadZip");

const pageRangeInput = document.getElementById("pageRange");
const formatSelect = document.getElementById("format");
const qualitySelect = document.getElementById("quality");

let generatedFiles = [];
let zip = null;

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

/* ---------- Page Range ---------- */
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

/* ---------- Main ---------- */
async function handleFile(file) {
  if (!file) return;

  output.innerHTML = "";
  generatedFiles = [];
  zip = null;
  downloadBtn.style.display = "none";
  statusText.textContent = "Processing PDF...";

  const reader = new FileReader();
  reader.onload = async () => {
    const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result)).promise;
    const pages = parsePages(pageRangeInput.value, pdf.numPages);

    if (pages.length > 2) zip = new JSZip();

    for (const pageNum of pages) {
      const page = await pdf.getPage(pageNum);
      const scale = qualitySelect.value === "high" ? 2.5 : 1.5;
      const viewport = page.getViewport({ scale });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const format = formatSelect.value;
      const mime = format === "jpg" ? "image/jpeg" : "image/png";
      const quality = format === "jpg"
        ? (qualitySelect.value === "low" ? 0.6 : 0.95)
        : undefined;

      canvas.toBlob(blob => {
        const filename = `page_${pageNum}.${format}`;
        generatedFiles.push({ blob, filename });

        if (zip) zip.file(filename, blob);

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        output.appendChild(img);

        // Direct download for 1–2 pages
        if (!zip) {
          const link = document.createElement("a");
          link.href = img.src;
          link.download = filename;
          link.textContent = `Download ${filename}`;
          link.style.display = "block";
          output.appendChild(link);
        } else {
          downloadBtn.style.display = "inline-block";
        }
      }, mime, quality);
    }

    statusText.textContent = "Conversion completed ✔";
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- ZIP Download ---------- */
downloadBtn.onclick = async () => {
  statusText.textContent = "Preparing ZIP...";
  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "pdf-images.zip");
  statusText.textContent = "ZIP downloaded ✔";
};
