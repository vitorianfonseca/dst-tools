import { useState, useRef, useCallback } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
 import { Button } from "@/components/ui/button";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Upload, X, Check, RotateCcw } from "lucide-react";
 import { toast } from "sonner";
 import { cn } from "@/lib/utils";
 
 interface ImageUploadProps {
   userId: string;
   currentUrl: string | null;
   onUpload: (url: string) => void;
   type: "avatar" | "banner";
   fallbackText?: string;
 }
 
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(blob);
  });
}

async function getCroppedImg(
  image: HTMLImageElement,
  crop: Crop,
  outputWidth: number,
  outputHeight: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) throw new Error("No 2d context");

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Canvas is empty"));
      },
      "image/jpeg",
      0.9
    );
  });
}

 export function ImageUpload({ userId, currentUrl, onUpload, type, fallbackText = "U" }: ImageUploadProps) {
   const [uploading, setUploading] = useState(false);
   const [preview, setPreview] = useState<string | null>(null);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const imgRef = useRef<HTMLImageElement>(null);
   const inputRef = useRef<HTMLInputElement>(null);
 
  const aspect = type === "avatar" ? 1 : 16 / 5;
  const outputSize = type === "avatar" 
    ? { width: 256, height: 256 } 
    : { width: 1200, height: 375 };

   const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
     const file = event.target.files?.[0];
     if (!file) return;
 
     if (!file.type.startsWith("image/")) {
       toast.error("Por favor seleciona uma imagem");
       return;
     }
 
     if (file.size > 5 * 1024 * 1024) {
       toast.error("A imagem deve ter menos de 5MB");
       return;
     }
 
     const reader = new FileReader();
    reader.onload = (e) => {
      setImageSrc(e.target?.result as string);
      setShowCropDialog(true);
    };
     reader.readAsDataURL(file);
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    },
    [aspect]
  );
 
  const handleCropComplete = async () => {
    if (!imgRef.current || !crop) return;

     setUploading(true);
    setShowCropDialog(false);
 
     try {
      const croppedBlob = await getCroppedImg(
        imgRef.current,
        crop,
        outputSize.width,
        outputSize.height
      );

      setPreview(URL.createObjectURL(croppedBlob));

      const dataUrl = await blobToDataUrl(croppedBlob);
      setPreview(dataUrl);
      onUpload(dataUrl);
       toast.success("Imagem carregada com sucesso!");
     } catch (error) {
       console.error("Upload error:", error);
       toast.error("Error loading image");
       setPreview(null);
     } finally {
       setUploading(false);
      setImageSrc(null);
     }
   };
 
  const handleCancelCrop = () => {
    setShowCropDialog(false);
    setImageSrc(null);
    if (inputRef.current) inputRef.current.value = "";
  };

   const handleClearPreview = () => {
     setPreview(null);
     if (inputRef.current) inputRef.current.value = "";
   };
 
   const displayUrl = preview || currentUrl;
 
  const cropDialog = (
    <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Recortar imagem</DialogTitle>
          <DialogDescription>
            Adjust the area of the image you want to use as {type === "avatar" ? "avatar" : "banner"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center py-4">
          {imageSrc && (
            <ReactCrop
              crop={crop}
              onChange={(c) => setCrop(c)}
              aspect={aspect}
              circularCrop={type === "avatar"}
              className="max-h-[400px]"
            >
              <img
                ref={imgRef}
                src={imageSrc}
                alt="Crop preview"
                onLoad={onImageLoad}
                className="max-h-[400px] w-auto"
              />
            </ReactCrop>
          )}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancelCrop} className="gap-2">
            <RotateCcw className="h-4 w-4" />
            Cancelar
          </Button>
          <Button onClick={handleCropComplete} disabled={uploading} className="gap-2">
            <Check className="h-4 w-4" />
            {uploading ? "A processar..." : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

   if (type === "avatar") {
     return (
      <>
        {cropDialog}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="h-20 w-20 border-2 border-border">
              <AvatarImage src={displayUrl || undefined} />
              <AvatarFallback className="text-xl bg-primary text-primary-foreground">
                {fallbackText}
              </AvatarFallback>
            </Avatar>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-col gap-2">
             <Button
               type="button"
              variant="outline"
               size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="gap-2"
             >
              <Upload className="h-4 w-4" />
              {uploading ? "Loading..." : "Upload Avatar"}
             </Button>
            {preview && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleClearPreview}
                className="gap-2 text-muted-foreground"
              >
                <X className="h-4 w-4" />
                Cancelar
              </Button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
         </div>
      </>
     );
   }
 
   // Banner type
   return (
    <>
      {cropDialog}
      <div className="space-y-2">
        <div
          className={cn(
            "relative h-24 rounded-lg border-2 border-dashed border-border bg-muted/50 overflow-hidden group cursor-pointer transition-colors hover:border-primary/50",
            uploading && "opacity-50 pointer-events-none"
          )}
          onClick={() => inputRef.current?.click()}
        >
          {displayUrl ? (
            <>
              <img
                src={displayUrl}
                alt="Banner preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <span className="text-sm">Click to upload banner</span>
             </div>
          )}
        </div>
        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearPreview}
            className="gap-2 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
       </div>
    </>
   );
 }