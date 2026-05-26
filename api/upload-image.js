const parseDataUrl = (dataUrl) => {
  const match = dataUrl.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1],
    base64: match[2],
  };
};

const dataUrlToBlob = (parsed) => {
  const buffer = Buffer.from(parsed.base64, "base64");
  return new Blob([buffer], { type: parsed.mimeType });
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  try {
    const { dataUrl } = req.body ?? {};

    if (!dataUrl || typeof dataUrl !== "string") {
      return res.status(400).json({ error: "Missing dataUrl" });
    }

    const parsed = parseDataUrl(dataUrl);
    if (!parsed) {
      return res.status(400).json({ error: "Invalid dataUrl" });
    }

    const uploadUrl =
      process.env.IMAGE_UPLOAD_URL ?? process.env.VITE_IMAGE_UPLOAD_URL;
    const uploadPreset =
      process.env.IMAGE_UPLOAD_PRESET ?? process.env.VITE_IMAGE_UPLOAD_PRESET;

    if (uploadUrl) {
      try {
        const blob = dataUrlToBlob(parsed);
        const extension =
          parsed.mimeType.split("/")[1] === "jpeg"
            ? "jpg"
            : parsed.mimeType.split("/")[1];
        const filename = `journal-${Date.now()}.${extension}`;

        const formData = new FormData();
        formData.append("file", blob, filename);
        if (uploadPreset) {
          formData.append("upload_preset", uploadPreset);
        }

        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          body: formData,
        });

        if (uploadResponse.ok) {
          const payload = await uploadResponse.json();
          const uploadedUrl = payload.secure_url || payload.url;

          if (uploadedUrl) {
            return res.status(201).json({ url: uploadedUrl });
          }
        }

        console.warn(
          "External image upload failed, falling back to inline data URL",
        );
      } catch (uploadError) {
        console.warn(
          "External image upload threw, falling back to inline data URL:",
          uploadError,
        );
      }
    }

    // No external storage configured in production: return the data URL so the
    // entry can still be saved and rendered without a 405/failed upload.
    return res.status(201).json({ url: dataUrl });
  } catch (error) {
    console.error("Upload image API error:", error);
    return res.status(500).json({ error: "Failed to save image" });
  }
}
