const fs = require('fs');

const path = 'app-vendor/src/app/(tabs)/dashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import { useState, useEffect, useCallback } from 'react';",
  "import { useState, useEffect, useCallback } from 'react';\nimport { useQuery } from '@tanstack/react-query';"
);

const stateRegex = /  const \[store, setStore\] = useState<any>\(null\);\n  const \[profitData, setProfitData\] = useState<any>\(null\);\n  const \[inventoryHealth, setInventoryHealth\] = useState<any>\(null\);\n  const \[topProducts, setTopProducts\] = useState<any\[\]>\(\[\]\);\n  const \[activeOrdersCount, setActiveOrdersCount\] = useState<number>\(0\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[refreshing, setRefreshing\] = useState\(false\);\n\n  const loadDashboardData = async \(\) => {[\s\S]*?  };\n\n  useEffect\(\(\) => {[\s\S]*?  }, \[\]\);\n\n  const onRefresh = useCallback\(\(\) => {[\s\S]*?  }, \[\]\);/;

const replacement = `  const [refreshing, setRefreshing] = useState(false);

  const { data: store, isLoading: loadingStore, refetch: refetchStore } = useQuery({
    queryKey: ['store', storeId],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/stores/\${storeId}\`);
      if (!res.ok) throw new Error('Failed to fetch store');
      return res.json();
    }
  });

  const { data: profitData, isLoading: loadingProfit, refetch: refetchProfit } = useQuery({
    queryKey: ['analytics', 'profit', storeId],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/analytics/profit?storeId=\${storeId}\`);
      if (!res.ok) throw new Error('Failed to fetch profit');
      return res.json();
    }
  });

  const { data: inventoryHealth, isLoading: loadingHealth, refetch: refetchHealth } = useQuery({
    queryKey: ['analytics', 'health', storeId],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/analytics/inventory-health?storeId=\${storeId}\`);
      if (!res.ok) throw new Error('Failed to fetch health');
      return res.json();
    }
  });

  const { data: topProducts = [], isLoading: loadingTop, refetch: refetchTop } = useQuery({
    queryKey: ['analytics', 'top', storeId],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/analytics/top-products?storeId=\${storeId}&limit=5&days=30\`);
      if (!res.ok) throw new Error('Failed to fetch top products');
      return res.json();
    }
  });

  const { data: activeOrdersCount = 0, refetch: refetchOrders } = useQuery({
    queryKey: ['orders', storeId, 'count'],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/orders?storeId=\${storeId}\`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const ordersData = await res.json();
      return ordersData.filter((o: any) => ['PAID', 'PICKING', 'READY_FOR_PICKUP'].includes(o.status)).length;
    },
    refetchInterval: 10000
  });

  const loading = loadingStore || loadingProfit || loadingHealth || loadingTop;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      refetchStore(),
      refetchProfit(),
      refetchHealth(),
      refetchTop(),
      refetchOrders()
    ]);
    setRefreshing(false);
  }, [refetchStore, refetchProfit, refetchHealth, refetchTop, refetchOrders]);`;

content = content.replace(stateRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting dashboard.tsx');
