import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Plus } from "lucide-react";

export default function ManageTextSpecials() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSpecial, setEditingSpecial] = useState<any>(null);
  
  const { data: specials, isLoading, refetch } = trpc.specials.textSpecials.list.useQuery();
  const createSpecial = trpc.specials.textSpecials.create.useMutation();
  const updateSpecial = trpc.specials.textSpecials.update.useMutation();
  const deleteSpecial = trpc.specials.textSpecials.delete.useMutation();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    displayOrder: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      displayOrder: "",
      isActive: true,
    });
    setEditingSpecial(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const data = {
        ...formData,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
      };

      if (editingSpecial) {
        await updateSpecial.mutateAsync({ id: editingSpecial.id, ...data });
        toast({ title: "Special updated successfully" });
      } else {
        await createSpecial.mutateAsync(data);
        toast({ title: "Special created successfully" });
      }
      
      refetch();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save special",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (special: any) => {
    setEditingSpecial(special);
    setFormData({
      title: special.title,
      description: special.description || "",
      displayOrder: special.displayOrder?.toString() || "",
      isActive: special.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this special?")) return;
    
    try {
      await deleteSpecial.mutateAsync({ id });
      toast({ title: "Special deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete special",
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading specials...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Text Specials</h1>
          <p className="text-muted-foreground mt-2">Create informational specials displayed on the specials page</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Special
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSpecial ? "Edit Special" : "Create New Special"}</DialogTitle>
              <DialogDescription>
                {editingSpecial ? "Update special details" : "Add a new text-only promotional special"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Lunchtime Special"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="2 slices and a can of pop for $4.69"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: e.target.value })}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
              </div>

              <DialogFooter>
                <Button type="submit" disabled={createSpecial.isPending || updateSpecial.isPending}>
                  {editingSpecial ? "Update Special" : "Create Special"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {specials && specials.length > 0 ? (
          specials.map((special: any) => (
            <Card key={special.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {special.title}
                      {!special.isActive && <span className="text-sm text-muted-foreground">(Inactive)</span>}
                    </CardTitle>
                    <CardDescription className="mt-2">{special.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(special)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(special.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Display Order: {special.displayOrder}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No specials created yet. Click "Add Special" to create your first text special.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
