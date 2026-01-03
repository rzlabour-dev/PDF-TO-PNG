async function handleFile(file) {
  output.innerHTML = "";
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
      const quality =
        format === "jpg"
          ? (qualitySelect.value === "low" ? 0.6 : 0.95)
          : undefined;

      canvas.toBlob(blob => {
        const url = URL.createObjectURL(blob);

        const img = document.createElement("img");
        img.src = url;
        output.appendChild(img);

        // ✅ MANUAL DOWNLOAD BUTTON (WORKS 100%)
        const btn = document.createElement("a");
        btn.href = url;
        btn.download = `page_${pageNum}.${format}`;
        btn.textContent = `Download ${format.toUpperCase()}`;
        btn.style.display = "inline-block";
        btn.style.margin = "10px";
        btn.style.padding = "8px 12px";
        btn.style.border = "1px solid #333";
        btn.style.background = "#fff";
        btn.style.cursor = "pointer";

        output.appendChild(btn);
      }, mime, quality);
    }

    statusText.textContent = "Done ✔ Click download buttons";
  };

  reader.readAsArrayBuffer(file);
}
