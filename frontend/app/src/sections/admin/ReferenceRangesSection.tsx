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
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FlaskConical,
  Activity,
  Info
} from 'lucide-react';
import { labReferenceRanges } from '@/data/labReferences';
import type { LabReferenceRange } from '@/types';

export function ReferenceRangesSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [ranges, setRanges] = useState<LabReferenceRange[]>(labReferenceRanges);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<LabReferenceRange | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const categories = Array.from(new Set(ranges.map(r => r.category)));

  const filteredRanges = ranges.filter(range => {
    const matchesSearch = range.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || range.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleSaveRange = () => {
    if (selectedRange) {
      setRanges(ranges.map(r => r.name === selectedRange.name ? selectedRange : r));
      setIsEditDialogOpen(false);
      setSelectedRange(null);
    }
  };

  const handleDeleteRange = (name: string) => {
    setRanges(ranges.filter(r => r.name !== name));
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'inflammatory':
        return <Activity className="w-4 h-4" />;
      default:
        return <FlaskConical className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      'Inflammatory': 'bg-red-500/10 text-red-600',
      'Hematology': 'bg-blue-500/10 text-blue-600',
      'Metabolic': 'bg-amber-500/10 text-amber-600',
      'Liver': 'bg-purple-500/10 text-purple-600',
      'Coagulation': 'bg-teal-500/10 text-teal-600',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-600';
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reference Ranges</h1>
          <p className="text-sm text-muted-foreground">
            Manage laboratory reference ranges for your institution
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Add Range
        </Button>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
            categoryFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
          }`}
        >
          All Categories
        </button>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setCategoryFilter(category)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              categoryFilter === category ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-muted'
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
          placeholder="Search lab parameters..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Reference Ranges Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left font-medium py-3 px-4">Parameter</th>
                  <th className="text-left font-medium py-3 px-4">Category</th>
                  <th className="text-left font-medium py-3 px-4">Reference Range</th>
                  <th className="text-left font-medium py-3 px-4">Unit</th>
                  <th className="text-right font-medium py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRanges.map((range) => (
                  <tr key={range.name} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getCategoryColor(range.category)}`}>
                          {getCategoryIcon(range.category)}
                        </div>
                        <span className="font-medium">{range.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant="outline" className="text-xs">
                        {range.category}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono">
                        {range.min} - {range.max}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-muted-foreground">{range.unit}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedRange(range);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleDeleteRange(range.name)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRanges.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold mb-1">No reference ranges found</h3>
              <p className="text-sm text-muted-foreground">
                Try adjusting your search or add a new reference range.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div>
              <h4 className="font-medium mb-1">About Reference Ranges</h4>
              <p className="text-sm text-muted-foreground">
                Reference ranges are used by the AI system to evaluate lab results. 
                These values are based on standard clinical references but can be customized 
                for your institution's specific patient population. Changes to reference ranges 
                will affect all future AI analyses.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Reference Range</DialogTitle>
            <DialogDescription>
              Update the reference range for {selectedRange?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedRange && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Parameter</Label>
                <Input value={selectedRange.name} disabled />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Input value={selectedRange.category} disabled />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min">Minimum</Label>
                  <Input
                    id="min"
                    type="number"
                    step="0.1"
                    value={selectedRange.min}
                    onChange={(e) => setSelectedRange({
                      ...selectedRange,
                      min: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max">Maximum</Label>
                  <Input
                    id="max"
                    type="number"
                    step="0.1"
                    value={selectedRange.max}
                    onChange={(e) => setSelectedRange({
                      ...selectedRange,
                      max: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input
                  id="unit"
                  value={selectedRange.unit}
                  onChange={(e) => setSelectedRange({
                    ...selectedRange,
                    unit: e.target.value
                  })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveRange}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
