const fs = require('fs');
const path = 'app-consumer/src/app/(tabs)/index.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useState, useEffect, useCallback } from 'react';",
  "import { useState, useEffect, useCallback } from 'react';\nimport { useQuery } from '@tanstack/react-query';"
);

// We need to replace the loadStoreAndProducts function and states with useQuery
const stateRegex = /  const \[products, setProducts\] = useState<any\[\]>\(\[\]\);\n  const \[store, setStore\] = useState<any>\(null\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[refreshing, setRefreshing\] = useState\(false\);\n  const \[activeCategory, setActiveCategory\] = useState\(0\);\n  const \[categories, setCategories\] = useState\(\[\{ name: 'All', icon: 'grid-outline', original: 'All' \}\]\);\n  const \[storeId, setStoreId\] = useState<string \| null>\(null\);\n  const \[bannerIndex, setBannerIndex\] = useState\(0\);\n\n  const \[clearanceProducts, setClearanceProducts\] = useState<any\[\]>\(\[\]\);\n  const \[newProducts, setNewProducts\] = useState<any\[\]>\(\[\]\);\n  const \[popularProducts, setPopularProducts\] = useState<any\[\]>\(\[\]\);\n  const \[activeCampaigns, setActiveCampaigns\] = useState<any\[\]>\(\[\]\);\n\n  \/\/ Cart badge animation\n  const cartScale = useSharedValue\(1\);\n  const cartBadgeStyle = useAnimatedStyle\(\(\) => \(\{\n    transform: \[\{ scale: cartScale.value \}\],\n  \}\)\);\n\n  \/\/ Removed animated background in favor of stock image\n\n  useEffect\(\(\) => \{\n    loadStoreAndProducts\(\);\n  \}, \[\]\);\n\n  \/\/ Auto-scroll banners\n  useEffect\(\(\) => \{\n    const interval = setInterval\(\(\) => \{\n      setBannerIndex\(prev => \(prev \+ 1\) % BANNERS.length\);\n    \}, 4000\);\n    return \(\) => clearInterval\(interval\);\n  \}, \[\]\);\n\n  const loadStoreAndProducts = async \(\) => \{[\s\S]*?  \};\n\n  const onRefresh = useCallback\(\(\) => \{[\s\S]*?  \}, \[\]\);/;

const replacement = `  const [refreshing, setRefreshing] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [storeId, setStoreId] = useState<string | null>(null);
  const [bannerIndex, setBannerIndex] = useState(0);

  // Cart badge animation
  const cartScale = useSharedValue(1);
  const cartBadgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cartScale.value }],
  }));

  useEffect(() => {
    AsyncStorage.getItem('@selected_store_id').then(id => {
      setStoreId(id || 'f15b0af3-3667-429a-ae2e-9f85d25e9c2f');
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % BANNERS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const { data: dashboardData, isLoading: loading, refetch } = useQuery({
    queryKey: ['consumerDashboard', storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const [productsRes, storeRes, clearanceRes, newRes, popularRes, campaignRes] = await Promise.all([
        fetch(\`\${API_BASE_URL}/inventory/products?storeId=\${storeId}\`),
        fetch(\`\${API_BASE_URL}/stores/\${storeId}\`),
        fetch(\`\${API_BASE_URL}/inventory/clearance?storeId=\${storeId}\`),
        fetch(\`\${API_BASE_URL}/inventory/new?storeId=\${storeId}\`),
        fetch(\`\${API_BASE_URL}/api/v1/catalog/personalized?storeId=\${storeId}\`),
        fetch(\`\${API_BASE_URL}/campaigns?storeId=\${storeId}\`)
      ]);

      const data = {
        products: [] as any[],
        store: null as any,
        clearanceProducts: [] as any[],
        newProducts: [] as any[],
        popularProducts: [] as any[],
        activeCampaigns: [] as any[],
        categories: [{ name: 'All', icon: 'grid-outline', original: 'All' }]
      };

      if (productsRes.ok) {
        const p = await productsRes.json();
        data.products = p.map(normalizeProduct);
        const uniqueCats = Array.from(new Set(data.products.map((p: any) => p.category))) as string[];
        data.categories = [
          { name: 'All', icon: 'grid-outline', original: 'All' },
          ...uniqueCats.map(c => ({ name: toTitleCase(c), icon: 'pricetag-outline', original: c }))
        ];
      }
      if (storeRes.ok) data.store = await storeRes.json();
      if (clearanceRes.ok) data.clearanceProducts = (await clearanceRes.json()).map(normalizeProduct);
      if (newRes.ok) data.newProducts = (await newRes.json()).map(normalizeProduct);
      if (popularRes.ok) data.popularProducts = (await popularRes.json()).map(normalizeProduct);
      if (campaignRes.ok) data.activeCampaigns = await campaignRes.json();

      return data;
    }
  });

  const products = dashboardData?.products || [];
  const store = dashboardData?.store || null;
  const clearanceProducts = dashboardData?.clearanceProducts || [];
  const newProducts = dashboardData?.newProducts || [];
  const popularProducts = dashboardData?.popularProducts || [];
  const activeCampaigns = dashboardData?.activeCampaigns || [];
  const categories = dashboardData?.categories || [{ name: 'All', icon: 'grid-outline', original: 'All' }];

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);`;

content = content.replace(stateRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting index.tsx');
