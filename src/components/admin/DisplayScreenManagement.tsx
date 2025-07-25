import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Upload, Monitor, Plus, Trash2, Image } from "lucide-react";

interface Slide {
  id: number;
  title: string;
  file_path: string;
  uploaded_at: string;
}

export const DisplayScreenManagement = () => {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    fetchSlides();
  }, []);

  const fetchSlides = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("showcase_slides")
        .select("*")
        .order("uploaded_at", { ascending: false });

      if (error) throw error;
      setSlides(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load slides",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  const uploadSlide = async () => {
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);
    
    try {
      // Upload file to storage
      const fileName = `slide-${Date.now()}-${file.name}`;
      
      // Simulate progress during upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev < 80) {
            return prev + 15;
          }
          return prev;
        });
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("slides")
        .upload(fileName, file);

      clearInterval(progressInterval);
      setUploadProgress(90);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("slides")
        .getPublicUrl(fileName);

      // Save slide record
      const { error: insertError } = await supabase
        .from("showcase_slides")
        .insert({
          title: title || file.name,
          file_path: publicUrl,
        });

      if (insertError) throw insertError;

      setUploadProgress(100);

      toast({
        title: "Success",
        description: "Slide uploaded successfully",
      });

      setIsDialogOpen(false);
      setTitle("");
      setFile(null);
      setTimeout(() => setUploadProgress(0), 1000);
      fetchSlides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload slide",
        variant: "destructive",
      });
    }
    setUploading(false);
  };

  const deleteSlide = async (slideId: number, filePath: string) => {
    if (!confirm("Are you sure you want to delete this slide?")) return;

    try {
      // Extract filename from the public URL
      const fileName = filePath.split('/').pop();
      
      // Delete from storage
      if (fileName) {
        await supabase.storage
          .from("slides")
          .remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase
        .from("showcase_slides")
        .delete()
        .eq("id", slideId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Slide deleted successfully",
      });

      fetchSlides();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete slide",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Monitor className="h-12 w-12 mx-auto text-muted-foreground mb-4 animate-pulse" />
            <p>Loading display content...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Display Screen Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload New Slide</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title (Optional)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter slide title"
                />
              </div>
              <div>
                <Label htmlFor="file">Image File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
              {uploading && uploadProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <Button onClick={uploadSlide} disabled={uploading || !file} className="w-full">
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Slide"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Showcase Slides ({slides.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slides.length === 0 ? (
            <div className="text-center py-8">
              <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Slides Found</h3>
              <p className="text-muted-foreground mb-4">
                Upload images to display on the showcase screen
              </p>
              <Button onClick={() => setIsDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Slide
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Preview</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {slides.map((slide) => (
                  <TableRow key={slide.id}>
                    <TableCell>
                      <img
                        src={slide.file_path}
                        alt={slide.title}
                        className="w-16 h-12 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {slide.title || 'Untitled'}
                    </TableCell>
                    <TableCell>
                      {new Date(slide.uploaded_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteSlide(slide.id, slide.file_path)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-center text-muted-foreground mb-4">
              Display Screen Preview - This is how it will appear to customers
            </p>
            <div className="bg-background rounded border min-h-64 flex items-center justify-center">
              {slides.length > 0 ? (
                <img
                  src={slides[0].file_path}
                  alt="Preview"
                  className="max-w-full max-h-64 object-contain rounded"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Monitor className="h-16 w-16 mx-auto mb-4" />
                  <p>No slides to display</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};