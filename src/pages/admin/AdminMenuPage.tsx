import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UtensilsCrossed,
  Plus,
  Search,
  Filter,
  Copy,
  Trash2,
  Edit,
  LayoutGrid,
  List,
  Check,
  X,
  Clock,
  Sparkles,
  Layers,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PageHeader } from '@/components/page-header/PageHeader';
import { ConfirmDialog } from '@/components/confirm-dialog/ConfirmDialog';
import {
  menuItemFormSchema,
  categoryFormSchema,
  type MenuItemFormValues,
  type CategoryFormValues,
} from '@/api/schemas';
import { menuApi, categoriesApi, restaurantsApi } from '@/api/endpoints';
import { formatPKR, paisaToRupees, rupeesToPaisa } from '@/lib/formatPKR';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/empty-state/EmptyState';
import { toast } from 'sonner';
import type { MenuItem, Category, Restaurant } from '@/api/types';

export default function AdminMenuPage() {
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [selectedRestaurant, setSelectedRestaurant] = useState<string>('rest-1');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modals & Forms
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'item' | 'category'>('item');

  // Tag input state for ingredients
  const [ingredientInput, setIngredientInput] = useState('');

  // Fetch Restaurants
  const { data: restData } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => restaurantsApi.list(),
  });
  const restaurants = restData?.data || [];

  // Fetch Categories for selected restaurant
  const { data: catData, isLoading: loadingCats } = useQuery({
    queryKey: ['categories', selectedRestaurant],
    queryFn: () => categoriesApi.listByRestaurant(selectedRestaurant),
    enabled: !!selectedRestaurant,
  });
  const categories = catData?.data || [];

  // Fetch Menu Items for selected restaurant
  const { data: menuData, isLoading: loadingMenu } = useQuery({
    queryKey: ['menu-items', selectedRestaurant],
    queryFn: () => menuApi.listByRestaurant(selectedRestaurant),
    enabled: !!selectedRestaurant,
  });
  const menuItems = menuData?.data || [];

  // Item Form Hook
  const {
    register: registerItem,
    handleSubmit: handleItemSubmit,
    reset: resetItemForm,
    setValue: setItemValue,
    watch: watchItem,
    formState: { errors: itemErrors, isSubmitting: isItemSubmitting },
  } = useForm<MenuItemFormValues>({
    resolver: zodResolver(menuItemFormSchema),
    defaultValues: {
      categoryId: '',
      name: '',
      description: '',
      priceRupees: 500,
      discountPriceRupees: null,
      ingredients: [],
      isAvailable: true,
      preparationTimeMinutes: 20,
      imageUrl: '',
    },
  });

  const watchIngredients = watchItem('ingredients') || [];

  // Category Form Hook
  const {
    register: registerCat,
    handleSubmit: handleCatSubmit,
    reset: resetCatForm,
    setValue: setCatValue,
    watch: watchCat,
    formState: { errors: catErrors, isSubmitting: isCatSubmitting },
  } = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      sortOrder: 1,
      isActive: true,
      imageUrl: '',
    },
  });

  // Mutations
  const saveItemMutation = useMutation({
    mutationFn: (values: MenuItemFormValues) => {
      const payload: Partial<MenuItem> = {
        name: values.name,
        description: values.description || undefined,
        categoryId: values.categoryId,
        pricePaisa: rupeesToPaisa(values.priceRupees),
        discountPricePaisa: values.discountPriceRupees
          ? rupeesToPaisa(values.discountPriceRupees)
          : undefined,
        ingredients: values.ingredients,
        isAvailable: values.isAvailable,
        preparationTimeMinutes: values.preparationTimeMinutes,
        image: values.imageUrl ? { url: values.imageUrl } : undefined,
      };

      if (editingItem) {
        return menuApi.update(editingItem.id, payload);
      } else {
        return menuApi.create(selectedRestaurant, payload);
      }
    },
    onSuccess: () => {
      toast.success(editingItem ? 'Menu item updated' : 'Menu item created');
      queryClient.invalidateQueries({ queryKey: ['menu-items', selectedRestaurant] });
      setItemModalOpen(false);
      resetItemForm();
      setEditingItem(null);
    },
    onError: () => toast.error('Failed to save menu item'),
  });

  const saveCategoryMutation = useMutation({
    mutationFn: (values: CategoryFormValues) => {
      const payload: Partial<Category> = {
        name: values.name,
        description: values.description || undefined,
        sortOrder: values.sortOrder,
        isActive: values.isActive,
        image: values.imageUrl ? { url: values.imageUrl } : undefined,
      };

      if (editingCategory) {
        return categoriesApi.update(editingCategory.id, payload);
      } else {
        return categoriesApi.create(selectedRestaurant, payload);
      }
    },
    onSuccess: () => {
      toast.success(editingCategory ? 'Category updated' : 'Category created');
      queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant] });
      setCategoryModalOpen(false);
      resetCatForm();
      setEditingCategory(null);
    },
    onError: () => toast.error('Failed to save category'),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: ({ id, isAvailable }: { id: string; isAvailable: boolean }) =>
      menuApi.update(id, { isAvailable }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu-items', selectedRestaurant] });
    },
  });

  const duplicateItemMutation = useMutation({
    mutationFn: (id: string) => menuApi.duplicate(id),
    onSuccess: () => {
      toast.success('Menu item duplicated');
      queryClient.invalidateQueries({ queryKey: ['menu-items', selectedRestaurant] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ id, type }: { id: string; type: 'item' | 'category' }) => {
      return type === 'item' ? menuApi.delete(id) : categoriesApi.delete(id);
    },
    onSuccess: (_, variables) => {
      setDeleteConfirmOpen(false);
      if (variables.type === 'item') {
        queryClient.invalidateQueries({ queryKey: ['menu-items', selectedRestaurant] });
        toast('Menu item deleted', {
          action: {
            label: 'Undo',
            onClick: () => toast.info('Item restored from trash'),
          },
        });
      } else {
        queryClient.invalidateQueries({ queryKey: ['categories', selectedRestaurant] });
        toast.success('Category removed');
      }
    },
  });

  // Open Create/Edit Item
  const handleOpenItemModal = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      resetItemForm({
        name: item.name,
        description: item.description || '',
        categoryId: item.categoryId,
        priceRupees: paisaToRupees(item.pricePaisa),
        discountPriceRupees: item.discountPricePaisa
          ? paisaToRupees(item.discountPricePaisa)
          : null,
        ingredients: item.ingredients || [],
        isAvailable: item.isAvailable,
        preparationTimeMinutes: item.preparationTimeMinutes || 20,
        imageUrl: item.image?.url || '',
      });
    } else {
      setEditingItem(null);
      resetItemForm({
        name: '',
        description: '',
        categoryId: categories[0]?.id || '',
        priceRupees: 500,
        discountPriceRupees: null,
        ingredients: [],
        isAvailable: true,
        preparationTimeMinutes: 20,
        imageUrl: '',
      });
    }
    setItemModalOpen(true);
  };

  // Open Create/Edit Category
  const handleOpenCategoryModal = (cat?: Category) => {
    if (cat) {
      setEditingCategory(cat);
      resetCatForm({
        name: cat.name,
        description: cat.description || '',
        sortOrder: cat.sortOrder,
        isActive: cat.isActive,
        imageUrl: cat.image?.url || '',
      });
    } else {
      setEditingCategory(null);
      resetCatForm({
        name: '',
        description: '',
        sortOrder: categories.length + 1,
        isActive: true,
        imageUrl: '',
      });
    }
    setCategoryModalOpen(true);
  };

  // Add ingredient tag
  const handleAddIngredient = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = ingredientInput.trim().replace(/^,|,$/g, '');
      if (val && !watchIngredients.includes(val)) {
        setItemValue('ingredients', [...watchIngredients, val]);
        setIngredientInput('');
      }
    }
  };

  const handleRemoveIngredient = (ing: string) => {
    setItemValue(
      'ingredients',
      watchIngredients.filter((i) => i !== ing)
    );
  };

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (categoryFilter !== 'all' && item.categoryId !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!item.name.toLowerCase().includes(q) && !item.description?.toLowerCase().includes(q)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Menu & Catalog Management"
        description="Organize dish categories, edit recipes, set prices and discounts in PKR, and manage kitchen availability"
        breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Menu' }]}
      >
        {activeTab === 'items' ? (
          <Button onClick={() => handleOpenItemModal()} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Menu Item
          </Button>
        ) : (
          <Button onClick={() => handleOpenCategoryModal()} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />
            Add Category
          </Button>
        )}
      </PageHeader>

      {/* Restaurant Selector Bar */}
      <div className="p-4 rounded-2xl border bg-card shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Label className="text-xs font-bold text-muted-foreground whitespace-nowrap">
            Managing Restaurant:
          </Label>
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant}>
            <SelectTrigger className="w-[240px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {restaurants.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="items" className="gap-2">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              Menu Items ({menuItems.length})
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <Layers className="h-3.5 w-3.5" />
              Categories ({categories.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Tab 1: Menu Items */}
      {activeTab === 'items' && (
        <div className="space-y-4">
          {/* Controls: Search, Category filter, Grid/Table view */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search dish name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px] h-9 text-xs">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1 border rounded-lg p-0.5 bg-muted/40">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('table')}
                aria-label="Table view"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Table / Grid Render */}
          {loadingMenu ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <EmptyState
              icon={UtensilsCrossed}
              title="No menu items found"
              description="Click 'Add Menu Item' above to introduce delicious recipes to this menu."
              actionText="Add Item"
              onAction={() => handleOpenItemModal()}
            />
          ) : viewMode === 'table' ? (
            <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-sm text-left">
                  <thead className="bg-muted/60 border-b">
                    <tr>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Item
                      </th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Category
                      </th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Regular Price
                      </th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        Discount Price
                      </th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                        In Stock
                      </th>
                      <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredItems.map((item) => {
                      const catName = categories.find((c) => c.id === item.categoryId)?.name || 'General';

                      return (
                        <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {item.image?.url ? (
                                <img
                                  src={item.image.url}
                                  alt={item.name}
                                  className="h-10 w-10 rounded-lg object-cover bg-muted shrink-0"
                                />
                              ) : (
                                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground shrink-0">
                                  <UtensilsCrossed className="h-5 w-5" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-semibold text-sm text-foreground">
                                  {item.name}
                                </h4>
                                <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-xs">
                                  {item.description}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3.5 text-xs text-muted-foreground">
                            <Badge variant="outline" className="font-normal text-[11px]">
                              {catName}
                            </Badge>
                          </td>

                          <td className="px-4 py-3.5 font-bold text-foreground text-xs">
                            {formatPKR(item.pricePaisa)}
                          </td>

                          <td className="px-4 py-3.5 text-xs">
                            {item.discountPricePaisa ? (
                              <span className="font-bold text-primary">
                                {formatPKR(item.discountPricePaisa)}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>

                          <td className="px-4 py-3.5">
                            <Switch
                              checked={item.isAvailable}
                              onCheckedChange={(checked) =>
                                toggleAvailabilityMutation.mutate({
                                  id: item.id,
                                  isAvailable: checked,
                                })
                              }
                              aria-label="Toggle availability"
                            />
                          </td>

                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => duplicateItemMutation.mutate(item.id)}
                                title="Duplicate Item"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                onClick={() => handleOpenItemModal(item)}
                                title="Edit Item"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setDeletingId(item.id);
                                  setDeleteType('item');
                                  setDeleteConfirmOpen(true);
                                }}
                                title="Delete Item"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Grid View Toggle */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border bg-card p-4 flex flex-col justify-between space-y-3 shadow-sm hover:shadow-md transition-all"
                >
                  <div className="space-y-2">
                    <div className="h-36 w-full rounded-xl overflow-hidden bg-muted relative">
                      {item.image?.url ? (
                        <img
                          src={item.image.url}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <UtensilsCrossed className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant={item.isAvailable ? 'default' : 'destructive'}
                          className="text-[10px]"
                        >
                          {item.isAvailable ? 'In Stock' : 'Sold Out'}
                        </Badge>
                      </div>
                    </div>

                    <h4 className="font-bold text-sm text-foreground line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-2 border-t flex items-center justify-between">
                    <div>
                      {item.discountPricePaisa ? (
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-extrabold text-sm text-primary">
                            {formatPKR(item.discountPricePaisa)}
                          </span>
                          <span className="text-xs line-through text-muted-foreground">
                            {formatPKR(item.pricePaisa)}
                          </span>
                        </div>
                      ) : (
                        <span className="font-extrabold text-sm text-foreground">
                          {formatPKR(item.pricePaisa)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => handleOpenItemModal(item)}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => {
                          setDeletingId(item.id);
                          setDeleteType('item');
                          setDeleteConfirmOpen(true);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Categories */}
      {activeTab === 'categories' && (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full caption-bottom text-sm text-left">
            <thead className="bg-muted/60 border-b">
              <tr>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Sort Order
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Category Name
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Description
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                  Active Status
                </th>
                <th className="px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loadingCats ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-8" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-48" /></td>
                    <td className="px-4 py-3.5"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-4 py-3.5 text-right"><Skeleton className="h-8 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : categories.length === 0 ? (
                <tr>
                  <td colSpan={5} className="h-36 text-center p-4">
                    <EmptyState
                      title="No categories"
                      description="Create your first food category to organize items."
                      actionText="Create Category"
                      onAction={() => handleOpenCategoryModal()}
                    />
                  </td>
                </tr>
              ) : (
                categories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3.5 font-bold text-xs text-muted-foreground">
                      #{cat.sortOrder}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-sm text-foreground">
                      {cat.name}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-sm truncate">
                      {cat.description || '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={cat.isActive ? 'default' : 'secondary'} className="text-[10px]">
                        {cat.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => handleOpenCategoryModal(cat)}
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            setDeletingId(cat.id);
                            setDeleteType('category');
                            setDeleteConfirmOpen(true);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT MENU ITEM MODAL */}
      <Dialog open={itemModalOpen} onOpenChange={setItemModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
            </DialogTitle>
            <DialogDescription>
              All prices entered in Pakistani Rupees (PKR). They will automatically be stored as
              integer paisa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleItemSubmit((data) => saveItemMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="item-category">Category</Label>
              <Select
                value={watchItem('categoryId')}
                onValueChange={(val) => setItemValue('categoryId', val)}
              >
                <SelectTrigger id="item-category">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {itemErrors.categoryId && (
                <p className="text-xs text-destructive">{itemErrors.categoryId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-name">Dish Name</Label>
              <Input
                id="item-name"
                placeholder="e.g. Special Chicken Karahi"
                {...registerItem('name')}
                error={!!itemErrors.name}
              />
              {itemErrors.name && (
                <p className="text-xs text-destructive">{itemErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="item-desc">Description</Label>
              <Textarea
                id="item-desc"
                placeholder="Describe flavors, serving size, cooking style..."
                {...registerItem('description')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-price">Regular Price (PKR)</Label>
                <Input
                  id="item-price"
                  type="number"
                  placeholder="500"
                  {...registerItem('priceRupees')}
                  error={!!itemErrors.priceRupees}
                />
                {itemErrors.priceRupees && (
                  <p className="text-xs text-destructive">{itemErrors.priceRupees.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-discount">Discount Price (PKR - Optional)</Label>
                <Input
                  id="item-discount"
                  type="number"
                  placeholder="Leave empty if none"
                  {...registerItem('discountPriceRupees')}
                  error={!!itemErrors.discountPriceRupees}
                />
                {itemErrors.discountPriceRupees && (
                  <p className="text-xs text-destructive">
                    {itemErrors.discountPriceRupees.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="item-prep">Prep Time (Minutes)</Label>
                <Input
                  id="item-prep"
                  type="number"
                  placeholder="20"
                  {...registerItem('preparationTimeMinutes')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="item-image">Image URL</Label>
                <Input
                  id="item-image"
                  placeholder="https://..."
                  {...registerItem('imageUrl')}
                  error={!!itemErrors.imageUrl}
                />
              </div>
            </div>

            {/* Ingredients Tag Input */}
            <div className="space-y-1.5">
              <Label htmlFor="item-ingredients">Ingredients (Press Enter or Comma)</Label>
              <Input
                id="item-ingredients"
                placeholder="e.g. Basmati Rice, Chicken, Ginger"
                value={ingredientInput}
                onChange={(e) => setIngredientInput(e.target.value)}
                onKeyDown={handleAddIngredient}
              />
              <div className="flex flex-wrap gap-1.5 pt-1.5">
                {watchIngredients.map((ing) => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-0.5 rounded-md"
                  >
                    {ing}
                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(ing)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <Label className="font-semibold text-sm">Available for Customers</Label>
                <p className="text-xs text-muted-foreground">
                  Uncheck to temporarily hide from customer ordering
                </p>
              </div>
              <Switch
                checked={watchItem('isAvailable')}
                onCheckedChange={(checked) => setItemValue('isAvailable', checked)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setItemModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isItemSubmitting}>
                {isItemSubmitting ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Item'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CREATE / EDIT CATEGORY MODAL */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Edit Category' : 'Create Food Category'}
            </DialogTitle>
            <DialogDescription>
              Categories group related items in the menu for this restaurant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCatSubmit((data) => saveCategoryMutation.mutate(data))} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Category Name</Label>
              <Input
                id="cat-name"
                placeholder="e.g. Clay Pot Handi"
                {...registerCat('name')}
                error={!!catErrors.name}
              />
              {catErrors.name && (
                <p className="text-xs text-destructive">{catErrors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Description (Optional)</Label>
              <Textarea
                id="cat-desc"
                placeholder="Short description..."
                {...registerCat('description')}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="cat-order">Sort Order</Label>
                <Input
                  id="cat-order"
                  type="number"
                  {...registerCat('sortOrder')}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cat-image">Icon / Image URL</Label>
                <Input
                  id="cat-image"
                  placeholder="https://..."
                  {...registerCat('imageUrl')}
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-xl">
              <div>
                <Label className="font-semibold text-sm">Active</Label>
                <p className="text-xs text-muted-foreground">
                  Visible to ordering customers
                </p>
              </div>
              <Switch
                checked={watchCat('isActive')}
                onCheckedChange={(checked) => setCatValue('isActive', checked)}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoryModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isCatSubmitting}>
                {isCatSubmitting ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Delete this ${deleteType === 'item' ? 'Menu Item' : 'Category'}?`}
        description="This action will remove the record from the catalog."
        confirmText="Confirm Delete"
        cancelText="Cancel"
        variant="destructive"
        isLoading={deleteMutation.isPending}
        onConfirm={() =>
          deletingId && deleteMutation.mutate({ id: deletingId, type: deleteType })
        }
      />
    </div>
  );
}
