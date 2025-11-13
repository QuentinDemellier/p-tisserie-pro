import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Tag } from "lucide-react";
import { toast } from "sonner";

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [editingCategory, setEditingCategory] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    order: 0
  });

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => base44.entities.Category.list('order')
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Category.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie créée avec succès");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la création de la catégorie")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Category.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie mise à jour");
      handleCloseDialog();
    },
    onError: () => toast.error("Erreur lors de la mise à jour")
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Category.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success("Catégorie supprimée");
    },
    onError: () => toast.error("Erreur lors de la suppression")
  });

  const handleOpenDialog = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name || "",
        description: category.description || "",
        order: category.order || 0
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: "",
        description: "",
        order: categories.length
      });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
    setFormData({
      name: "",
      description: "",
      order: 0
    });
  };

  const handleSubmit = () => {
    if (!formData.name) {
      toast.error("Le nom de la catégorie est obligatoire");
      return;
    }

    const data = {
      ...formData,
      order: parseInt(formData.order) || 0
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des catégories</h1>
            <p className="text-gray-600">Organisez votre catalogue par catégories</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={() => handleOpenDialog()}
                className="bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle catégorie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingCategory ? "Modifier la catégorie" : "Nouvelle catégorie"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nom de la catégorie *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="mt-2"
                    placeholder="Ex: Tartes, Gâteaux..."
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="mt-2"
                    placeholder="Description de la catégorie..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="order">Ordre d'affichage</Label>
                  <Input
                    id="order"
                    type="number"
                    min="0"
                    value={formData.order}
                    onChange={(e) => setFormData({...formData, order: e.target.value})}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Les catégories sont affichées par ordre croissant
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCloseDialog}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-[#E0A890] to-[#C98F75] hover:from-[#C98F75] hover:to-[#B07E64] text-white"
                  >
                    {editingCategory ? "Mettre à jour" : "Créer"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="border-[#DFD3C3]/30 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardHeader className="border-b border-[#DFD3C3]/30 bg-gradient-to-r from-[#F8EDE3] to-white">
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#C98F75]" />
              Liste des catégories ({categories.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="h-16 bg-[#DFD3C3]/20 animate-pulse rounded" />
                ))}
              </div>
            ) : categories.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucune catégorie. Créez votre première catégorie !</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[#F8EDE3]/50">
                      <TableHead>Ordre</TableHead>
                      <TableHead>Nom</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categories.map(category => (
                      <TableRow key={category.id} className="hover:bg-[#F8EDE3]/20">
                        <TableCell>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E0A890] to-[#C98F75] flex items-center justify-center text-white font-bold">
                            {category.order}
                          </div>
                        </TableCell>
                        <TableCell className="font-semibold text-lg">
                          {category.name}
                        </TableCell>
                        <TableCell className="text-gray-600">
                          {category.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDialog(category)}
                              className="hover:bg-[#E0A890]/10"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) {
                                  deleteMutation.mutate(category.id);
                                }
                              }}
                              className="hover:bg-red-50 text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}