// src/components/profile/AvatarCropModal.jsx
// npm i react-easy-crop
import React, { useState, useCallback, useEffect } from "react";
import Cropper from "react-easy-crop";
import Button from "../ui/Button.jsx";
import { getCroppedImage } from "../../util/cropImage.js";

function AvatarCropModal({
  open,
  src,
  kind = "avatar", // 'avatar' | 'cover'
  coverAspect = 3 / 1, // se ajusta desde ProfileSettings según el tamaño real del cover
  onClose,
  onCropped, // (file) => Promise<void>
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [busy, setBusy] = useState(false);

  // avatar = 1:1; cover = ratio calculado en el shell
  const aspect = kind === "cover" ? coverAspect || 3 / 1 : 1;
  const cropShape = kind === "cover" ? "rect" : "round";

  const handleCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  // Resetear estado al abrir con otra imagen
  useEffect(() => {
    if (open) {
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedAreaPixels(null);
    }
  }, [open, src, kind, aspect]);

  if (!open || !src) return null;

  const handleConfirm = async () => {
    if (!croppedAreaPixels || !src) {
      onClose?.();
      return;
    }
    try {
      setBusy(true);

      // 1) Recortamos lo que se ve en el modal → Blob
      const blob = await getCroppedImage(src, croppedAreaPixels);

      // 2) Lo convertimos en File para enviarlo por FormData
      const fileName = kind === "cover" ? "profile-cover.jpg" : "avatar.jpg";
      const file = new File([blob], fileName, { type: "image/jpeg" });

      await onCropped?.(file);
    } catch (e) {
      console.error("Error cropping image:", e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="profile-modal-backdrop">
      <div className="profile-modal">
        <header className="profile-modal-header">
          <h3>
            {kind === "cover" ? "Adjust your cover" : "Adjust your avatar"}
          </h3>
          <p>Drag to reframe and use the slider to zoom.</p>
        </header>

        <div className="profile-modal-body">
          <div className="profile-cropper-wrapper">
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              cropShape={cropShape}
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
          <div className="profile-cropper-controls">
            <span>Zoom</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />
          </div>
        </div>

        <footer className="profile-modal-footer">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            loading={busy}
          >
            Save
          </Button>
        </footer>
      </div>
    </div>
  );
}

export default AvatarCropModal;
