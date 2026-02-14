import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Pill,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { mockDrugs } from '@/data/mockData';
import { formatCurrency } from '@/lib/utils';
import type { Drug } from '@/types';

export function DrugDatabaseSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>(mockDrugs);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [newDrug, setNewDrug] = useState({
    name: '',
    genericName: '',
    category: '',
    averageCost: 0,
  });

  const filteredDrugs = drugs.filter(drug => 
    drug.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.genericName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    drug.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddDrug = () => {
    const drug: Drug = {
      id: `drug_${Date.now()}`,
      name: newDrug.name,
      genericName: newDrug.genericName,
      brandNames: [],
      category: newDrug.category,
      dosageForms: [],
      strengths: [],
      averageCost: newDrug.averageCost,
      alternatives: [],
      contraindications: [],
      sideEffects: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setDrugs([...drugs, drug]);
    setNewDrug({ name: '', genericName: '', category: '', averageCost: 0 });
    setIsAddDialogOpen(false);
  };

  const handleDeleteDrug = (id: string) => {
    setDrugs(drugs.filter(d => d.id !== id));
  };

  const categories = Array.from(new Set(drugs.map(d => d.category)));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Drug Database</h1>
          <p className="text-sm text-muted-foreground">
            Manage medications and their information
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add Drug
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Drug</DialogTitle>
              <DialogDescription>
                Enter the drug information to add it to the database.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Brand Name</Label>
                <Input
                  id="name"
                  value={newDrug.name}
                  onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                  placeholder="e.g., Augmentin"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="genericName">Generic Name</Label>
                <Input
                  id="genericName"
                  value={newDrug.genericName}
                  onChange={(e) => setNewDrug({ ...newDrug, genericName: e.target.value })}
                  placeholder="e.g., Amoxicillin/Clavulanate"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={newDrug.category}
                  onChange={(e) => setNewDrug({ ...newDrug, category: e.target.value })}
                  placeholder="e.g., Antibiotic"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Average Cost ($)</Label>
                <Input
                  id="cost"
                  type="number"
                  value={newDrug.averageCost}
                  onChange={(e) => setNewDrug({ ...newDrug, averageCost: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddDrug} disabled={!newDrug.name || !newDrug.genericName}>
                Add Drug
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSearchQuery('')}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            searchQuery === '' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
          }`}
        >
          All
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSearchQuery(category)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              searchQuery === category ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search drugs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Drugs Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredDrugs.map((drug) => (
          <Card key={drug.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedDrug(drug)}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold">{drug.name}</div>
                    <div className="text-sm text-muted-foreground">{drug.genericName}</div>
                  </div>
                </div>
                <Badge variant="outline">{drug.category}</Badge>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span>{formatCurrency(drug.averageCost)}</span>
                </div>
                {drug.contraindications.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>{drug.contraindications.length} contraindications</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t flex items-center justify-between">
                <div className="flex gap-1">
                  {drug.dosageForms.slice(0, 2).map((form, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {form}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteDrug(drug.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredDrugs.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-1">No drugs found</h3>
          <p className="text-sm text-muted-foreground">
            Try adjusting your search or add a new drug.
          </p>
        </div>
      )}

      {/* Drug Detail Dialog */}
      <Dialog open={!!selectedDrug} onOpenChange={() => setSelectedDrug(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDrug?.name}</DialogTitle>
            <DialogDescription>{selectedDrug?.genericName}</DialogDescription>
          </DialogHeader>
          {selectedDrug && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge>{selectedDrug.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  {formatCurrency(selectedDrug.averageCost)}
                </span>
              </div>

              {selectedDrug.brandNames.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Brand Names</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDrug.brandNames.map((name, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDrug.dosageForms.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Dosage Forms</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDrug.dosageForms.map((form, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {form}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedDrug.contraindications.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Contraindications</Label>
                  <ul className="mt-1 space-y-1">
                    {selectedDrug.contraindications.map((item, index) => (
                      <li key={index} className="text-sm flex items-center gap-2 text-red-600">
                        <AlertTriangle className="w-3 h-3" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedDrug.sideEffects.length > 0 && (
                <div>
                  <Label className="text-sm text-muted-foreground">Side Effects</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedDrug.sideEffects.map((effect, index) => (
                      <span key={index} className="text-sm text-muted-foreground">
                        {effect}{index < selectedDrug.sideEffects.length - 1 ? ',' : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedDrug(null)}>
              Close
            </Button>
            <Button>Edit Drug</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
