const fs = require('fs');

const path = 'app-vendor/src/app/(tabs)/orders.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "import React, { useState, useEffect, useCallback, useRef } from 'react';",
  "import React, { useState, useEffect, useCallback, useRef } from 'react';\nimport { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';"
);

// Replace the states and fetchOrders with React Query
const stateRegex = /  const \[orders, setOrders\] = useState<any\[\]>\(\[\]\);\n  const \[loading, setLoading\] = useState\(true\);\n  const \[refreshing, setRefreshing\] = useState\(false\);\n  const \[activeColIndex, setActiveColIndex\] = useState\(0\);\n  const scrollViewRef = useRef<ScrollView>\(null\);\n  const tabsListRef = useRef<FlatList>\(null\);\n  \n  const fetchOrders = async \(\) => {[\s\S]*?};\n\n  useEffect\(\(\) => {[\s\S]*?  }, \[\]\);\n\n  const onRefresh = useCallback\(\(\) => {[\s\S]*?  }, \[\]\);\n\n  const updateOrderStatus = async \(orderId: string, newStatus: string\) => {[\s\S]*?  };/;

const replacement = `  const [refreshing, setRefreshing] = useState(false);
  const [activeColIndex, setActiveColIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const tabsListRef = useRef<FlatList>(null);
  
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['orders', CURRENT_STORE_ID],
    queryFn: async () => {
      const res = await fetch(\`\${API_BASE_URL}/orders?storeId=\${CURRENT_STORE_ID}\`);
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      const relevantOrders = data.filter((o: any) => 
        ['PAID', 'PICKING', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'DELIVERED'].includes(o.status)
      );
      relevantOrders.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return relevantOrders;
    },
    staleTime: 1000 * 60, // 1 min
    refetchInterval: 10000 // Polling fallback
  });

  useEffect(() => {
    const channel = supabase.channel(\`store:\${CURRENT_STORE_ID}:orders\`)
      .on('broadcast', { event: 'order_update' }, (payload) => {
        console.log('Realtime order update received:', payload);
        queryClient.invalidateQueries({ queryKey: ['orders', CURRENT_STORE_ID] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string, newStatus: string }) => {
      const res = await fetch(\`\${API_BASE_URL}/orders/\${orderId}/status\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, staffId: CURRENT_STAFF_ID })
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onMutate: async ({ orderId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ['orders', CURRENT_STORE_ID] });
      const previousOrders = queryClient.getQueryData(['orders', CURRENT_STORE_ID]);
      
      // Optimistically update
      queryClient.setQueryData(['orders', CURRENT_STORE_ID], (old: any) => {
        if (!old) return old;
        return old.map((order: any) => 
          order.id === orderId ? { ...order, status: newStatus } : order
        );
      });
      
      return { previousOrders };
    },
    onError: (err, variables, context) => {
      if (context?.previousOrders) {
        queryClient.setQueryData(['orders', CURRENT_STORE_ID], context.previousOrders);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', CURRENT_STORE_ID] });
    }
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };`;

content = content.replace(stateRegex, replacement);
fs.writeFileSync(path, content, 'utf8');
console.log('Done rewriting orders.tsx');
