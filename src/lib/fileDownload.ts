// Hands the browser a file to save. Knows nothing about what is in it.
export const downloadTextFile = ({
  fileName,
  contents,
  mimeType,
}: {
  fileName: string;
  contents: string;
  mimeType: string;
}) => {
  const url = URL.createObjectURL(new Blob([contents], { type: mimeType }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
