// URL del Web App de Google Apps Script (endpoint que guarda las fotos en Drive).
const UPLOAD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbyrUQEmmYu9XO_qigb5Y1TJMjeGQZSjO2W01CMF7RITZFwlKiKKPF9h3zurnYp45WM/exec';

// ============ Subida de fotos ============
const uploadForm = document.getElementById('upload-form');
const photosInput = document.getElementById('photos');
const preview = document.getElementById('upload-preview');
const statusEl = document.getElementById('upload-status');
const submitBtn = document.getElementById('upload-submit');
const fileStatus = document.getElementById('file-status');

photosInput.addEventListener('change', () => {
  preview.innerHTML = '';
  const files = Array.from(photosInput.files);

  fileStatus.textContent = files.length === 0
    ? 'Ningún archivo seleccionado'
    : files.length === 1
      ? files[0].name
      : `${files.length} fotos seleccionadas`;

  files.forEach((file) => {
    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    preview.appendChild(img);
  });
});

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = result.substring(result.indexOf(',') + 1);
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

uploadForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const files = Array.from(photosInput.files);
  if (files.length === 0) {
    statusEl.textContent = 'Elegí al menos una foto.';
    statusEl.dataset.state = 'error';
    return;
  }

  submitBtn.disabled = true;
  statusEl.dataset.state = '';
  statusEl.textContent = 'Subiendo fotos...';

  try {
    const encodedFiles = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: await fileToBase64(file),
      }))
    );

    const response = await fetch(UPLOAD_ENDPOINT, {
      method: 'POST',
      // text/plain evita el preflight CORS que Apps Script no responde.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ files: encodedFiles }),
    });

    const result = await response.json();

    if (result.status === 'ok') {
      statusEl.dataset.state = 'ok';
      statusEl.textContent = '¡Gracias! Tus fotos se subieron correctamente.';
      uploadForm.reset();
      preview.innerHTML = '';
    } else {
      throw new Error(result.message || 'Error desconocido');
    }
  } catch (err) {
    statusEl.dataset.state = 'error';
    statusEl.textContent = 'No pudimos subir las fotos. Probá de nuevo en un momento.';
    console.error(err);
  } finally {
    submitBtn.disabled = false;
  }
});
