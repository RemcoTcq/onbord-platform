import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, ClipboardPaste, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  onImported: (text: string) => void;
  disabled?: boolean;
}

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const idx = result.indexOf(",");
      resolve(idx >= 0 ? result.slice(idx + 1) : result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

export const JobOfferImporter = ({ onImported, disabled }: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasted, setPasted] = useState("");
  const [extracting, setExtracting] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const lower = file.name.toLowerCase();
    const okExt =
      lower.endsWith(".pdf") || lower.endsWith(".docx") || lower.endsWith(".txt");
    if (!okExt) {
      toast.error("Format non supporté. Utilisez PDF, DOCX ou TXT.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Fichier trop volumineux (max 5 Mo).");
      return;
    }

    setExtracting(true);
    try {
      const fileBase64 = await fileToBase64(file);
      const { data, error } = await supabase.functions.invoke("import-job-offer", {
        body: { fileName: file.name, fileType: file.type, fileBase64 },
      });
      if (error) {
        const msg = (error as any)?.context?.body
          ? (() => {
              try {
                return JSON.parse((error as any).context.body).error;
              } catch {
                return null;
              }
            })()
          : null;
        toast.error(msg || "Impossible de lire ce fichier.");
        return;
      }
      const text = (data as any)?.text as string | undefined;
      if (!text) {
        toast.error("Aucun texte extrait du fichier.");
        return;
      }
      onImported(text);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la lecture du fichier.");
    } finally {
      setExtracting(false);
    }
  };

  const handlePasteSubmit = () => {
    const t = pasted.trim();
    if (t.length < 30) {
      toast.error("Le texte est trop court.");
      return;
    }
    setPasteOpen(false);
    setPasted("");
    onImported(t);
  };

  const busy = disabled || extracting;

  return (
    <div className="rounded-lg border border-card-foreground/15 bg-card-foreground/[0.03] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <FileText className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-card-foreground">
              Vous avez déjà une offre d'emploi&nbsp;?
            </h3>
            <p className="text-xs text-card-foreground/60">
              Importez-la pour pré-remplir automatiquement le formulaire (PDF, DOCX ou TXT, max 5 Mo).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="gap-2"
            >
              {extracting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importer un fichier
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPasteOpen(true)}
              disabled={busy}
              className="gap-2"
            >
              <ClipboardPaste className="h-4 w-4" />
              Coller le texte
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      </div>

      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Coller votre offre d'emploi</DialogTitle>
            <DialogDescription>
              Collez le texte de l'offre. L'IA va l'analyser et pré-remplir le formulaire.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={pasted}
            onChange={(e) => setPasted(e.target.value)}
            placeholder="Collez ici le contenu complet de l'offre d'emploi…"
            rows={12}
            className="resize-none"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasteOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handlePasteSubmit} disabled={pasted.trim().length < 30}>
              Analyser
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
