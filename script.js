const input = document.getElementById("pdfInput");
const output = document.getElementById("output");
const statusText = document.getElementById("status");

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

input.addEventListener("change", async function () {
  output.innerHTML = "";
  statusText.textContent = "Processing PDF...";

  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function () {
    const typedArray = new Uint8Array(this.result);
    const pdf = await pdfjsLib.getDocument(typedArray).promise;

    statusText.textContent = `Total Pages: ${pdf.numPages}`;

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2 });

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      const img = document.createElement("img");
      img.src = canvas.toDataURL("image/png");
      img.alt = `Page ${pageNum}`;

      output.appendChild(img);
    }

    statusText.textContent = "Conversion completed ✔";
  };

  reader.readAsArrayBuffer(file);
});
