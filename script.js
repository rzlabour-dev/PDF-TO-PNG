const input = document.getElementById("pdfInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");
const downloadBtn = document.getElementById("downloadZip");

const zip = new JSZip();
let imageCount = 0;

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

input.addEventListener("change", async function () {
  output.innerHTML = "";
  zip.files = {};
  imageCount = 0;
  downloadBtn.disabled = true;

  statusText.textContent = "Processing PDF...";

  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;

      canvas.toBlob(function (blob) {
        imageCount++;
        const fileName = `page_${imageCount}.png`;

        zip.file(fileName, blob);
        downloadBtn.disabled = false;

        const img = document.createElement("img");
        img.src = URL.createObjectURL(blob);
        output.appendChild(img);
      });
    }

    statusText.textContent = "Conversion completed ✔";
  };

  reader.readAsArrayBuffer(file);
});

downloadBtn.addEventListener("click", async function () {
  if (imageCount === 0) return;

  statusText.textContent = "Preparing ZIP file...";

  const content = await zip.generateAsync({ type: "blob" });
  saveAs(content, "pdf-images.zip");

  statusText.textContent = "ZIP downloaded ✔";
});
