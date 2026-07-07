const fs = require('fs');
const path = 'app-consumer/src/app/store/[id].tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useState, useEffect, useCallback, useMemo } from 'react';",
  "import { useState, useEffect, useCallback, useMemo } from 'react';\nimport { useQuery, useQueryClient } from '@tanstack/react-query';"
);

const stateRegex = /  const \[products, setProducts\] = useState<any\[\]>\(\[\]\);\n  const \[store, setStore\] = useState<any>\(null\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[refreshing, setRefreshing\] = useState\(false\);\n  const \[activeCategory, setActiveCategory\] = useState\(0\);\n\n  \/\/ Cart badge animation\n  const cartScale = useSharedValue\(1\);\n  const cartBadgeStyle = useAnimatedStyle\(\(\) => \(\{\n    transform: \[\{ scale: cartScale.value \}\],\n  \}\)\);\n\n  useEffect\(\(\) => \{\n    if \(storeId\) loadStoreAndProducts\(\);\n  \}, \[storeId\]\);\n\n  const loadStoreAndProducts = async \(\) => \{[\s\S]*?  \};\n\n  const onRefresh = useCallback\(\(\) => \{[\s\S]*?  \}, \[storeId\]\);\n\n  \n  useEffect\(\(\) => \{[\s\S]*?    \const channel = supabase.channel\(`store:\${storeId}:inventory`\)[\s\S]*?      .subscribe\(\);\n\n    return \(\) => \{\n      supabase.removeChannel\(channel\);\n    \};\n  \}, \[storeId\]\);/;

const replacement = `  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);

  const queryClient = useQueryClient();

  // Cart badge animation
  const cartScale = useSharedValue(1);
  const cartBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  const { data: storeData, isLoading: loading, refetch } = useQuery({
    queryKey: ['storeDetails', storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const [productsRes, storeRes] = await Promise.all([
        fetch(\`\${API_BASE_URL}/inventory/products?storeId=\${storeId}\`),
        fetch(\`\${API_BASE_URL}/stores/\${storeId}\`),
      ]);

      let products = [];
      let store = null;

      if (productsRes.ok) {
        const data = await productsRes.json();
        products = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category || 'Uncategorized',
          price: p.sellingPrice,
          mrp: p.mrp,
          image: p.imageUrl || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=300&h=300',
          stockStatus: p.inventory && p.inventory.length > 0 && p.inventory[0].onHandQty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK',
        }));
      }

      if (storeRes.ok) {
        store = await storeRes.json();
      }
      
      return { products, store };
    }
  });

  const products = storeData?.products || [];
  const store = storeData?.store || null;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    if (!storeId) return;
    
    const channel = supabase.channel(\`store:\${storeId}:inventory\`)
      .on('broadcast', { event: 'inventory_update' }, (payload) => {
        // Optimistic cache update for inventory
        queryClient.invalidateQueries({ queryKey: ['storeDetails', storeId] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId, queryClient]);`;

content = content.replace(stateRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting store/[id].tsx');
