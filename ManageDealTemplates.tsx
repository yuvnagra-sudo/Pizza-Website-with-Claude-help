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

export default function ManageDealTemplates() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDeal, setEditingDeal] = useState<any>(null);
  
  const { data: deals, isLoading, refetch } = trpc.specials.dealTemplates.list.useQuery();
  const createDeal = trpc.specials.dealTemplates.create.useMutation();
  const updateDeal = trpc.specials.dealTemplates.update.useMutation();
  const deleteDeal = trpc.specials.dealTemplates.delete.useMutation();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    items: "[]", // JSON string
    regularPrice: "",
    specialPrice: "",
    displayOrder: "",
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      items: "[]",
      regularPrice: "",
      specialPrice: "",
      displayOrder: "",
      isActive: true,
    });
    setEditingDeal(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Parse items JSON
      let itemsArray;
      try {
        itemsArray = JSON.parse(formData.items);
      } catch {
        toast({ 
          title: "Invalid JSON", 
          description: "Items must be valid JSON format",
          variant: "destructive" 
        });
        return;
      }

      const data = {
        name: formData.name,
        description: formData.description,
        items: itemsArray,
        regularPrice: formData.regularPrice,
        specialPrice: formData.specialPrice,
        displayOrder: formData.displayOrder ? parseInt(formData.displayOrder) : 0,
        isActive: formData.isActive,
      };

      if (editingDeal) {
        await updateDeal.mutateAsync({ id: editingDeal.id, ...data });
        toast({ title: "Deal updated successfully" });
      } else {
        await createDeal.mutateAsync(data);
        toast({ title: "Deal created successfully" });
      }
      
      refetch();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to save deal",
        variant: "destructive" 
      });
    }
  };

  const handleEdit = (deal: any) => {
    setEditingDeal(deal);
    setFormData({
      name: deal.name,
      description: deal.description || "",
      items: JSON.stringify(deal.items, null, 2),
      regularPrice: deal.regularPrice,
      specialPrice: deal.specialPrice,
      displayOrder: deal.displayOrder?.toString() || "",
      isActive: deal.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this deal?")) return;
    
    try {
      await deleteDeal.mutateAsync({ id });
      toast({ title: "Deal deleted successfully" });
      refetch();
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete deal",
        variant: "destructive" 
      });
    }
  };

  if (isLoading) {
    return <div className="container py-8">Loading deals...</div>;
  }

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Manage Deal Templates</h1>
          <p className="text-muted-foreground mt-2">Create customizable deals that customers can order from the specials page</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Deal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingDeal ? "Edit Deal" : "Create New Deal"}</DialogTitle>
              <DialogDescription>
                {editingDeal ? "Update deal template details" : "Add a new deal template for customers to order"}
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Deal Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Family Feast"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Perfect for the whole family!"
                  rows={2}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="regularPrice">Regular Price *</Label>
                  <Input
                    id="regularPrice"
                    type="number"
                    step="0.01"
                    value={formData.regularPrice}
                    onChange={(e) => setFormData({ ...formData, regularPrice: e.target.value })}
                    placeholder="39.99"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="specialPrice">Special Price *</Label>
                  <Input
                    id="specialPrice"
                    type="number"
                    step="0.01"
                    value={formData.specialPrice}
                    onChange={(e) => setFormData({ ...formData, specialPrice: e.target.value })}
                    placeholder="29.99"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="items">Items (JSON) *</Label>
                <Textarea
                  id="items"
                  value={formData.items}
                  onChange={(e) => setFormData({ ...formData, items: e.target.value })}
                  placeholder='[{"menuItemId": 1, "size": "large", "quantity": 2, "allowCustomization": true}]'
                  rows={6}
                  className="font-mono text-sm"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  JSON array of items. Each item: {`{menuItemId, size, quantity, allowCustomization}`}
                </p>
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
                <Button type="submit" disabled={createDeal.isPending || updateDeal.isPending}>
                  {editingDeal ? "Update Deal" : "Create Deal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {deals && deals.length > 0 ? (
          deals.map((deal: any) => (
            <Card key={deal.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {deal.name}
                      {!deal.isActive && <span className="text-sm text-muted-foreground">(Inactive)</span>}
                    </CardTitle>
                    {deal.description && (
                      <CardDescription className="mt-2">{deal.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(deal)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(deal.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm text-muted-foreground line-through mr-2">${deal.regularPrice}</span>
                      <span className="text-2xl font-bold text-primary">${deal.specialPrice}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">Order: {deal.displayOrder}</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-semibold mb-1">Items Included:</p>
                    <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(deal.items, null, 2)}
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No deals created yet. Click "Add Deal" to create your first deal template.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
